{ ... }:
{
  networking.applicationFirewall.enable = true;
  networking.applicationFirewall.blockAllIncoming = false;
  networking.applicationFirewall.allowSigned = true;
  networking.applicationFirewall.allowSignedApp = false;
  networking.applicationFirewall.enableStealthMode = true;

  networking.dns = [
    "1.1.1.1"
    "1.0.0.1"
  ];
  networking.knownNetworkServices = [
    "Wi-Fi"
    "Ethernet"
    "Thunderbolt Bridge"
  ];

  system.defaults = {
    NSGlobalDomain = {
      AppleEnableSwipeNavigateWithScrolls = false;
      ApplePressAndHoldEnabled = false;
      AppleShowScrollBars = "WhenScrolling";
      AppleMeasurementUnits = "Centimeters";
      AppleTemperatureUnit = "Celsius";
      AppleMetricUnits = 1;
      InitialKeyRepeat = 15;
      KeyRepeat = 2;
      AppleInterfaceStyle = "Dark";
      AppleIconAppearanceTheme = "RegularDark";
    };

    dock = {
      autohide = true;
      autohide-delay = 0.0;
      autohide-time-modifier = 0.25;
      largesize = 72;
      magnification = true;
      mineffect = "genie";
      orientation = "left";
      tilesize = 36;
      wvous-bl-corner = 1;
      wvous-br-corner = 1;
      wvous-tl-corner = 1;
      wvous-tr-corner = 1;
      show-recents = true;
    };

    finder = {
      AppleShowAllExtensions = true;
      FXEnableExtensionChangeWarning = true;
      FXPreferredViewStyle = "clmv";
      NewWindowTarget = "Home";
      ShowExternalHardDrivesOnDesktop = true;
      ShowHardDrivesOnDesktop = false;
      ShowPathbar = true;
      ShowRemovableMediaOnDesktop = true;
      _FXSortFoldersFirst = true;
      _FXSortFoldersFirstOnDesktop = true;
    };

    iCal = {
      "first day of week" = "Monday";
      "TimeZone support enabled" = true;
      CalendarSidebarShown = false;
    };

    hitoolbox.AppleFnUsageType = "Do Nothing";

    menuExtraClock = {
      ShowAMPM = true;
      # 0 shows the date when space allows, 1 always shows it, and 2 hides it.
      ShowDate = 0;
      ShowDayOfWeek = true;
      ShowSeconds = true;
    };

    SoftwareUpdate.AutomaticallyInstallMacOSUpdates = true;

    trackpad = {
      Clicking = false;
      Dragging = false;
      ForceSuppressed = false;
      TrackpadFourFingerHorizSwipeGesture = 2;
      TrackpadFourFingerPinchGesture = 2;
      TrackpadPinch = true;
      TrackpadRightClick = true;
      TrackpadRotate = true;
      TrackpadThreeFingerDrag = false;
      TrackpadThreeFingerTapGesture = 0;
      TrackpadTwoFingerDoubleTapGesture = true;
      TrackpadTwoFingerFromRightEdgeSwipeGesture = 3;
    };

    universalaccess.mouseDriverCursorSize = 1.2;

    WindowManager = {
      EnableStandardClickToShowDesktop = false;
      EnableTiledWindowMargins = false;
      EnableTilingByEdgeDrag = false;
      EnableTopTilingByEdgeDrag = false;
    };

    CustomUserPreferences = {
      "com.apple.AdLib".allowApplePersonalizedAdvertising = false;
      "com.apple.desktopservices" = {
        DSDontWriteNetworkStores = true;
        DSDontWriteUSBStores = true;
      };
      "com.apple.finder".ShowRecentTags = false;

      "com.apple.iCal" = {
        "Show Week Numbers" = true;
        "last minute of work hours" = 1200; # 8 p.m.
        "number of hours displayed" = 8;
      };

      "com.apple.BezelServices" = {
        kDim = true;
        kDimTime = 10;
      };
      NSGlobalDomain = {
        AppleLanguages = [ "en-US" ];
        AppleLocale = "en_US";
        NSGlassTintAmount = 1.0;
        NSUserKeyEquivalents = {
          "Show Writing Tools" = "@^.";
        };
      };
      "com.apple.universalaccess" = {
        "com.apple.custommenu.apps" = [ "NSGlobalDomain" ];
      };
      "com.apple.Accessibility" = {
        AccessibilityEnabled = true;
        ApplicationAccessibilityEnabled = true;
        SpeakThisEnabled = true;
        SpokenContentDefaultVoiceSelectionsByLanguage = [
          "en"
          {
            _type = "Speech.VoiceSelection";
            _version = 0;
            boundLanguage = "en";
            voiceId = "com.apple.siri.natural.Damon";
          }
        ];
      };
      "com.apple.symbolichotkeys" = {
        AppleSymbolicHotKeys = {
          # Spotlight Search (Cmd+Space)
          "64" = {
            enabled = 0;
            value = {
              parameters = [
                32
                49
                1048576
              ];
              type = "standard";
            };
          };
          # Move left a space (Ctrl+Left)
          "79" = {
            enabled = 1;
            value = {
              parameters = [
                65535
                123
                262144
              ];
              type = "standard";
            };
          };
          # Move right a space (Ctrl+Right)
          "81" = {
            enabled = 1;
            value = {
              parameters = [
                65535
                124
                262144
              ];
              type = "standard";
            };
          };
        };
      };
    };

    CustomSystemPreferences = {
      "/Library/Preferences/com.apple.SoftwareUpdate" = {
        AutomaticDownload = true;
        ConfigDataInstall = true;
        CriticalUpdateInstall = true;
      };
      "/Library/Preferences/com.apple.commerce".AutoUpdate = true;
    };

    loginwindow = {
      DisableConsoleAccess = true;
      GuestEnabled = false;
    };

    screensaver = {
      askForPassword = true;
      askForPasswordDelay = 0;
    };
  };
}
