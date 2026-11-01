#import <AppKit/AppKit.h>
#import <ApplicationServices/ApplicationServices.h>
#import <CommonCrypto/CommonDigest.h>
#include <dlfcn.h>

static int (*connectionID)(void);
static CGError (*registerImages)(int, const char *, bool, bool, CGSize, CGPoint, NSUInteger, CGFloat, CFArrayRef, int *);
static CGError (*activate)(int, const char *, int *);
static CGError (*copyNamed)(int, const char *, CGSize *, CGPoint *, NSUInteger *, CGFloat *, CFArrayRef *);
static CGError (*selectArrow)(int, int);
static void (*dockOverride)(int, bool);

static void fail(NSString *message) {
    fprintf(stderr, "%s\n", message.UTF8String);
    exit(1);
}

static NSDictionary *readPlist(NSString *path) {
    NSError *error = nil;
    NSData *data = [NSData dataWithContentsOfFile:path options:0 error:&error];
    id value = data ? [NSPropertyListSerialization propertyListWithData:data options:0 format:NULL error:&error] : nil;
    if (![value isKindOfClass:NSDictionary.class]) fail(error.localizedDescription ?: @"Invalid property list");

    return value;
}

static BOOL cursorName(id value) {
    return [value isKindOfClass:NSString.class] && [value hasPrefix:@"com.apple."];
}

static void requireInventory(NSDictionary *entries, NSArray *required) {
    if (![required isKindOfClass:NSArray.class] || !required.count) fail(@"Missing required cursor inventory");

    for (id name in required) if (!cursorName(name)) fail(@"Invalid required cursor name");
    NSSet *expected = [NSSet setWithArray:required];
    if (expected.count != required.count || ![expected isEqualToSet:[NSSet setWithArray:entries.allKeys]])
        fail(@"Cursor set does not match the required inventory");
}

static void validate(NSDictionary *cursors, NSDictionary *aliases, NSArray *required) {
    if (![cursors isKindOfClass:NSDictionary.class] || !cursors.count) fail(@"No cursors in theme");
    requireInventory(cursors, required);

    for (id name in cursors) {
        id c = cursors[name];
        if (!cursorName(name) || ![c isKindOfClass:NSDictionary.class]) fail(@"Invalid cursor entry");

        for (NSString *key in @[@"PointsWide", @"PointsHigh", @"HotSpotX", @"HotSpotY", @"FrameCount", @"FrameDuration"]) {
            id number = c[key];
            if (![number isKindOfClass:NSNumber.class] || !isfinite([number doubleValue])) fail(@"Invalid cursor metadata");
        }

        double width = [c[@"PointsWide"] doubleValue], height = [c[@"PointsHigh"] doubleValue];
        double frames = [c[@"FrameCount"] doubleValue], duration = [c[@"FrameDuration"] doubleValue];
        double x = [c[@"HotSpotX"] doubleValue], y = [c[@"HotSpotY"] doubleValue];
        id reps = c[@"Representations"];
        if (width <= 0 || height <= 0 || width > 128 || height > 128 || frames < 1 || frames > 24 || floor(frames) != frames ||
            duration < 0 || x < 0 || y < 0 || x >= width || y >= height)
            fail([@"Invalid cursor geometry: " stringByAppendingString:name]);

        if (c[@"VectorPDF"]) {
            id pdf = c[@"VectorPDF"], shadow = c[@"VectorShadow"];
            if (![pdf isKindOfClass:NSData.class] || ![pdf length] || [pdf length] > 1024 * 1024 ||
                reps || ![shadow isKindOfClass:NSDictionary.class]) fail(@"Invalid vector cursor");

            for (NSString *key in @[@"VectorOffsetX", @"VectorOffsetTop"]) {
                id number = c[key];
                if (![number isKindOfClass:NSNumber.class] || !isfinite([number doubleValue]) ||
                    fabs([number doubleValue]) > 128) fail(@"Invalid vector placement");
            }
            if (c[@"Native1x"] && (![c[@"Native1x"] isKindOfClass:NSData.class] || [c[@"Native1x"] length] > 16 * 1024 * 1024))
                fail(@"Invalid native 1x image");

            for (NSString *key in @[@"Blur", @"OffsetX", @"OffsetY"]) {
                id number = shadow[key];
                if (![number isKindOfClass:NSNumber.class] || !isfinite([number doubleValue]) ||
                    fabs([number doubleValue]) > 128) fail(@"Invalid vector shadow");
            }
            if ([shadow[@"Blur"] doubleValue] < 0) fail(@"Invalid vector shadow blur");

            id color = shadow[@"Color"];
            if (![color isKindOfClass:NSArray.class] || [color count] != 4) fail(@"Invalid vector shadow color");

            for (id component in color) {
                if (![component isKindOfClass:NSNumber.class] || !isfinite([component doubleValue]) ||
                    [component doubleValue] < 0 || [component doubleValue] > 1) fail(@"Invalid vector shadow color");
            }
        } else if (![reps isKindOfClass:NSArray.class] || ![reps count] || [reps count] > 16) {
            fail([@"Invalid cursor representations: " stringByAppendingString:name]);
        }
    }

    for (id name in aliases) {
        id values = aliases[name];
        if (!cursorName(name) || ![values isKindOfClass:NSArray.class]) fail(@"Invalid alias entry");

        for (id alias in values) if (!cursorName(alias)) fail(@"Invalid alias name");
    }
}

static NSArray *renderVector(NSDictionary *cursor) {
    CGDataProviderRef provider = CGDataProviderCreateWithCFData((__bridge CFDataRef)cursor[@"VectorPDF"]);
    CGPDFDocumentRef pdf = provider ? CGPDFDocumentCreateWithProvider(provider) : NULL;
    if (provider) CGDataProviderRelease(provider);
    if (!pdf || !CGPDFDocumentIsUnlocked(pdf) || CGPDFDocumentGetNumberOfPages(pdf) != 1) fail(@"Invalid single-page cursor PDF");

    CGPDFPageRef page = CGPDFDocumentGetPage(pdf, 1);
    CGRect box = CGPDFPageGetBoxRect(page, kCGPDFMediaBox);
    CGFloat width = [cursor[@"PointsWide"] doubleValue], height = [cursor[@"PointsHigh"] doubleValue];
    NSUInteger frames = [cursor[@"FrameCount"] unsignedIntegerValue];
    if (box.origin.x != 0 || box.origin.y != 0 || CGPDFPageGetRotationAngle(page) != 0 ||
        !isfinite(box.size.width) || !isfinite(box.size.height) || box.size.width <= 0 || box.size.width > 128 ||
        box.size.height <= 0 || box.size.height > 128 * frames ||
        (frames > 1 && box.size.height != height * frames))
        fail(@"Invalid cursor PDF canvas or animation sheet");

    NSDictionary *shadow = cursor[@"VectorShadow"];
    CGFloat rgba[4];
    for (NSUInteger i = 0; i < 4; i++) rgba[i] = [shadow[@"Color"][i] doubleValue];
    CGColorSpaceRef space = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    CGColorRef color = CGColorCreate(space, rgba);
    NSMutableArray *images = [NSMutableArray array];

    for (NSNumber *factor in @[@1, @2, @4, @5, @8, @10]) {
        CGFloat scale = factor.doubleValue;
        if (scale == 1 && cursor[@"Native1x"]) {
            NSBitmapImageRep *bitmap = [[NSBitmapImageRep alloc] initWithData:cursor[@"Native1x"]];
            if (!bitmap.CGImage || bitmap.pixelsWide != width || bitmap.pixelsHigh != height * frames)
                fail(@"Native 1x image does not match its logical canvas");

            bitmap = [bitmap bitmapImageRepByRetaggingWithColorSpace:NSColorSpace.sRGBColorSpace] ?: bitmap;
            [images addObject:(__bridge id)bitmap.CGImage];
            continue;
        }

        CGContextRef context = CGBitmapContextCreate(NULL, (size_t)(width * scale), (size_t)(height * frames * scale),
            8, 0, space, kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);
        if (!context) fail(@"Cannot render cursor PDF");

        CGContextScaleCTM(context, scale, scale);
        CGContextSetShadowWithColor(context, CGSizeMake([shadow[@"OffsetX"] doubleValue], [shadow[@"OffsetY"] doubleValue]),
            [shadow[@"Blur"] doubleValue], color);
        CGContextTranslateCTM(context, [cursor[@"VectorOffsetX"] doubleValue],
            height * frames - box.size.height - [cursor[@"VectorOffsetTop"] doubleValue]);
        CGContextDrawPDFPage(context, page);
        CGImageRef image = CGBitmapContextCreateImage(context);
        CGContextRelease(context);
        if (!image) fail(@"Cannot create rendered cursor image");

        [images addObject:CFBridgingRelease(image)];
    }

    CGColorRelease(color);
    CGColorSpaceRelease(space);
    CGPDFDocumentRelease(pdf);

    return images;
}

static NSArray *decodeImages(NSDictionary *cursor) {
    if (cursor[@"VectorPDF"]) return renderVector(cursor);

    NSMutableArray *images = [NSMutableArray array];
    for (NSData *data in cursor[@"Representations"]) {
        if (![data isKindOfClass:NSData.class]) fail(@"Invalid cursor image data");

        NSBitmapImageRep *bitmap = [[NSBitmapImageRep alloc] initWithData:data];
        if (!bitmap.CGImage) fail(@"Cannot decode cursor image");

        NSColorSpace *space = bitmap.colorSpace.numberOfColorComponents == 1 ? NSColorSpace.genericGamma22GrayColorSpace : NSColorSpace.sRGBColorSpace;
        bitmap = [bitmap bitmapImageRepByRetaggingWithColorSpace:space] ?: bitmap;
        [images addObject:(__bridge id)bitmap.CGImage];
    }

    if (!images.count) fail(@"Cursor has no images");

    return [images sortedArrayUsingComparator:^NSComparisonResult(id left, id right) {
        size_t a = CGImageGetWidth((__bridge CGImageRef)left), b = CGImageGetWidth((__bridge CGImageRef)right);

        return a < b ? NSOrderedAscending : a > b ? NSOrderedDescending : NSOrderedSame;
    }];
}

static NSData *pixelHash(CGImageRef image) {
    size_t width = CGImageGetWidth(image), height = CGImageGetHeight(image);
    CGColorSpaceRef space = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    CGContextRef context = CGBitmapContextCreate(NULL, width, height, 8, width * 4, space,
                                               kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);
    CGColorSpaceRelease(space);
    if (!context) fail(@"Cannot compare cursor pixels");

    CGContextSetBlendMode(context, kCGBlendModeCopy);
    CGContextDrawImage(context, CGRectMake(0, 0, width, height), image);

    unsigned char digest[CC_SHA256_DIGEST_LENGTH];
    CC_SHA256(CGBitmapContextGetData(context), (CC_LONG)(width * height * 4), digest);
    CGContextRelease(context);

    return [NSData dataWithBytes:digest length:sizeof digest];
}

static void checkArtwork(NSDictionary *cursors, NSDictionary *images) {
    NSUInteger vectors = 0;
    for (NSString *name in [cursors.allKeys sortedArrayUsingSelector:@selector(compare:)]) {
        NSDictionary *cursor = cursors[name];
        CGFloat largest = 0;
        for (id value in images[name]) {
            CGImageRef image = (__bridge CGImageRef)value;
            CGFloat scale = CGImageGetWidth(image) / [cursor[@"PointsWide"] doubleValue];
            CGFloat vertical = CGImageGetHeight(image) / ([cursor[@"PointsHigh"] doubleValue] * [cursor[@"FrameCount"] unsignedIntegerValue]);
            if (fabs(scale - vertical) > 0.000001) fail([@"Mismatched cursor representation geometry: " stringByAppendingString:name]);

            largest = MAX(largest, scale);
        }
        if (largest < 8) {
            id reason = cursor[@"NativeRasterLimit"];
            if (![reason isKindOfClass:NSString.class] || ![reason length])
                fail([@"Insufficient artwork for maximum-size Retina cursor: " stringByAppendingString:name]);

            printf("Native artwork limit: %s: %s\n", name.UTF8String, [reason UTF8String]);
        }
        if (cursor[@"VectorPDF"]) vectors++;
    }
    printf("Artwork checked: %lu PDF sources, %lu native bitmap sources.\n", (unsigned long)vectors, (unsigned long)(cursors.count - vectors));
}

static BOOL matches(int cid, NSString *name, NSDictionary *cursor, NSArray *expected) {
    CGSize size = CGSizeZero;
    CGPoint hotspot = CGPointZero;
    NSUInteger frames = 0;
    CGFloat duration = 0;
    CFArrayRef output = NULL;
    CGError result = copyNamed(cid, name.UTF8String, &size, &hotspot, &frames, &duration, &output);
    NSArray *actual = CFBridgingRelease(output);

    if (result || actual.count != expected.count || frames != [cursor[@"FrameCount"] unsignedIntegerValue] ||
        size.width != [cursor[@"PointsWide"] doubleValue] || size.height != [cursor[@"PointsHigh"] doubleValue] ||
        hotspot.x != [cursor[@"HotSpotX"] doubleValue] || hotspot.y != [cursor[@"HotSpotY"] doubleValue] ||
        fabs(duration - [cursor[@"FrameDuration"] doubleValue]) > 0.000001) {
        fprintf(stderr, "%s: error=%d images=%lu/%lu size=%gx%g/%gx%g hotspot=%g,%g/%g,%g frames=%lu/%lu duration=%g/%g\n", name.UTF8String, result, (unsigned long)actual.count, (unsigned long)expected.count, size.width, size.height, [cursor[@"PointsWide"] doubleValue], [cursor[@"PointsHigh"] doubleValue], hotspot.x, hotspot.y, [cursor[@"HotSpotX"] doubleValue], [cursor[@"HotSpotY"] doubleValue], (unsigned long)frames, [cursor[@"FrameCount"] unsignedLongValue], duration, [cursor[@"FrameDuration"] doubleValue]);
        return NO;
    }

    for (NSUInteger i = 0; i < actual.count; i++) {
        CGImageRef a = (__bridge CGImageRef)actual[i], e = (__bridge CGImageRef)expected[i];

        if (CGImageGetWidth(a) != CGImageGetWidth(e) || CGImageGetHeight(a) != CGImageGetHeight(e) ||
            ![pixelHash(a) isEqual:pixelHash(e)]) {
            fprintf(stderr, "%s: representation %lu actual=%zux%zu expected=%zux%zu pixels match=%d\n", name.UTF8String, (unsigned long)i, CGImageGetWidth(a), CGImageGetHeight(a), CGImageGetWidth(e), CGImageGetHeight(e), [pixelHash(a) isEqual:pixelHash(e)]);
            return NO;
        }
    }

    return YES;
}

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        if (argc != 4)
            fail(@"Usage: cursor --dry-run|--apply|--check theme.cape aliases.plist");

        NSString *mode = @(argv[1]);
        if (![@[@"--dry-run", @"--apply", @"--check"] containsObject:mode]) fail(@"Unknown mode");

        NSDictionary *theme = readPlist(@(argv[2]));
        NSDictionary *cursors = theme[@"Cursors"];
        NSDictionary *aliases = readPlist(@(argv[3]));
        validate(cursors, aliases, theme[@"RequiredCursors"]);

        NSMutableDictionary *images = [NSMutableDictionary dictionary];
        for (NSString *name in cursors) {
            images[name] = decodeImages(cursors[name]);
        }
        checkArtwork(cursors, images);

        NSMutableDictionary *registrations = [cursors mutableCopy];
        for (NSString *name in cursors) {
            for (NSString *alias in aliases[name]) if (!cursors[alias]) {
                registrations[alias] = cursors[name];
                images[alias] = images[name];
            }
        }
        requireInventory(registrations, theme[@"RequiredRegistrations"]);

        void *library = dlopen("/System/Library/PrivateFrameworks/SkyLight.framework/SkyLight", RTLD_NOW);
        if (!library) fail(@"Cannot load macOS cursor APIs");
#define LOAD(variable, symbol) do { *(void **)(&variable) = dlsym(RTLD_DEFAULT, symbol); if (!variable) *(void **)(&variable) = dlsym(library, symbol); if (!variable) fail(@"Missing API: " @symbol); } while (0)
        LOAD(connectionID, "CGSMainConnectionID");
        LOAD(registerImages, "CGSRegisterCursorWithImages");
        LOAD(activate, "CGSSetRegisteredCursor");
        LOAD(copyNamed, "CGSCopyRegisteredCursorImages");
        LOAD(selectArrow, "CGSSetSystemDefinedCursor");
        LOAD(dockOverride, "CGSSetDockCursorOverride");

        if ([mode isEqual:@"--dry-run"]) {
            printf("Validated %lu cursors and available macOS APIs; no changes made.\n", (unsigned long)cursors.count);
            return 0;
        }

        int cid = connectionID();
        if (!cid) fail(@"No graphical login session");

        if ([mode isEqual:@"--apply"]) {
            for (NSString *name in [registrations.allKeys sortedArrayUsingSelector:@selector(compare:)]) {
                NSDictionary *c = registrations[name];
                CGSize size = CGSizeMake([c[@"PointsWide"] doubleValue], [c[@"PointsHigh"] doubleValue]);
                CGPoint hotspot = CGPointMake([c[@"HotSpotX"] doubleValue], [c[@"HotSpotY"] doubleValue]);
                int seed = 0;
                CGError result = registerImages(cid, name.UTF8String, true, true, size, hotspot,
                    [c[@"FrameCount"] unsignedIntegerValue], [c[@"FrameDuration"] doubleValue], (__bridge CFArrayRef)images[name], &seed);
                if (result) fail([NSString stringWithFormat:@"Failed registering %@ (%d); log out to reset cursors", name, result]);

                result = activate(cid, name.UTF8String, &seed);
                if (result) fail([NSString stringWithFormat:@"Failed activating %@ (%d); log out to reset cursors", name, result]);
            }

            dockOverride(cid, true);
            CGError selected = selectArrow(cid, 0);
            if (selected) fail([NSString stringWithFormat:@"Cannot select arrow cursor (%d)", selected]);
        }

        NSUInteger verified = 0;
        for (NSString *name in registrations) {
            if (!matches(cid, name, registrations[name], images[name])) {
                fprintf(stderr, "Readback mismatch: %s\n", name.UTF8String);
            } else verified++;
        }

        printf("Verified %lu/%lu cursor registrations (geometry, hotspots, animation and image pixels).\n",
               (unsigned long)verified, (unsigned long)registrations.count);

        return verified == registrations.count ? 0 : 1;
    }
}
