# Go Coding Style

Language-specific preferences for Go projects. Read the generic `coding_style.md` first for universal principles.

Any rule that names fx, Fiber, GORM, Viper, Ginkgo/Gomega, Goose, Mage, Zap, or
Prometheus applies only when the repository already uses that tool. Do not introduce or
migrate to them to comply with this file. Preserve the repository's package and directory
layout otherwise.

## 1. Project Structure

The package and file layouts below apply only when the repository already follows them.
Otherwise preserve its established layout and use these entries only as naming guidance
within equivalent existing boundaries.

### Package Organization
- **Domain packages at the project root when bounded contexts justify them**: Keep cohesive domain types, behavior, ports, and errors together. Small programs may use a flatter package structure.
- **`adapters/` directory for infrastructure**: HTTP server, database drivers, logging, metrics, health checks live under `adapters/` (e.g., `adapters/http/`, `adapters/postgres/`, `adapters/logger/`).
- **`config/` for configuration**: Viper-based configuration with a top-level `App` struct that nests per-adapter config structs.
- **`cmd/` for entry points**: Main applications (server, migration runner) under `cmd/<name>/`.
- **`test/` for shared test utilities**: Test drivers, matchers, request builders, transaction helpers.

### File Naming Within a Package
- **Entity files**: Named after the concept (`habit.go`, `activity.go`, `group.go`).
- **Service files**: `<entity>_service.go` (e.g., `habit_service.go`, `activity_service.go`).
- **Repository implementations**: `<entity>_sql_repository.go` (or `<entity>_<store>_repository.go`).
- **Controller files**: `controller.go` (one per domain package).
- **Module files**: `module.go` (one per package, defines the fx module).
- **Config files**: `config.go` (one per package).
- **Probe files**: `prom_probe.go` for Prometheus implementation, `nop_probe.go` for no-op.
- **Error files**: `error.go` when errors grow beyond a few lines.
- **Mock files**: `mock.go` for mockgen-generated mocks.

## 2. Dependency Injection (uber/fx)

### Module Pattern
Every package exposes a single `var Module = fx.Module(...)` that provides its constructors and invokes initialization:

```go
var Module = fx.Module(
    "habit",
    fx.Provide(NewHabitService),
    fx.Provide(NewHabitSQLRepository),
    fx.Provide(func(repo *HabitSQLRepository) HabitRepository { return repo }),
    fx.Invoke(RegisterRoutes),
)
```

### Constructor Functions
- Accept explicit dependencies as function parameters. No service locator pattern.
- Return the concrete type (or concrete type + error).
- The fx module provides interface bindings separately via `fx.Provide(func(concrete *SQLRepository) Repository { return concrete })`.

### Lifecycle Hooks
Use `fx.Lifecycle` for startup/shutdown:

```go
lc.Append(fx.Hook{
    OnStart: func(context.Context) error { ... },
    OnStop:  func(context.Context) error { ... },
})
```

### Decoration for Tests
Use `fx.Decorate` to swap implementations in tests (e.g., `NopProbeProvider`):

```go
var NopProbeProvider = fx.Decorate(func() Probe { return NopProbe{} })
```

## 3. Domain Modeling

### Entities
- Domain structs contain domain data and behavior, without `json` or `gorm` tags.
- Adapter persistence models own GORM tags, generated database keys, and associations;
  explicit mappers translate them to domain types when the shapes differ.

### DTOs
- Plain structs for each operation: `CreateHabitDTO`, `UpdateHabitDTO`, `FindHabitDTO`.
- No tags needed on DTOs (they don't serialize to JSON or DB directly).
- Separate from entities -- they represent operation inputs, not persisted state.

### Domain and Port Errors
- Package-level `var` using `errors.New`:

```go
var (
    ErrNotFound   = errors.New("habit not found") // domain outcome
    ErrRepository = errors.New("repository error") // port failure
)
```

### Repository Interfaces
- Defined in the domain package alongside entities.
- Methods accept `context.Context` as first parameter.
- Return domain types plus stable port errors. Reserve domain errors for business outcomes.

## 4. Repository Implementation

### GORM Patterns
- Always use `WithContext(ctx)` for context propagation.
- Use `Preload("Association")` for eager loading.
- Parameterized queries (`Where("user_id = ?", userID)`) -- never string interpolation.

### Error Translation Layer
Each GORM repository translates driver failures into stable port errors. Domain errors
remain reserved for business outcomes:

```go
func translateError(err error) error {
    switch {
    case err == nil:
        return nil
    case errors.Is(err, gorm.ErrRecordNotFound):
        return ErrNotFound
    default:
        return ErrRepository
    }
}
```

Also a `resultErr` helper for operations where `RowsAffected == 0` means not found.

## 5. HTTP Layer (Fiber)

### Controller Pattern
- Controller struct holds services and logger as fields.
- `Register(app *fiber.App)` method sets up routes and middleware.
- Handler methods are unexported (lowercase) and follow the `func(ctx *fiber.Ctx) error` signature.
- Request payload structs defined at the bottom of the controller file.

### Middleware
- Authentication/authorization as controller methods (e.g., `middlewareDecodeToken`).
- Resource loading as middleware (e.g., `middlewareFindHabit` sets `ctx.Locals("habit", h)`).
- `ctx.Locals()` for passing data through the middleware chain.

### Error-to-Status Mapping
- Domain errors mapped to HTTP status codes in the controller.
- `errors.Is(err, ErrNotFound)` -> 404.
- Log the error with `zap.Error(err)`, return generic status to client. Never leak error details.

### Route Registration
- Routes registered via `fx.Invoke` in the HTTP module.
- Controllers call `Register(app)` to set up their route groups.

## 6. Configuration (Viper)

### Config Structs
Each package defines its own `Config` struct with `mapstructure` tags:

```go
type Config struct {
    Port    int     `mapstructure:"port"`
    Limiter Limiter `mapstructure:"limiter"`
}
```

### Config Module
The `config` package:
- Loads from YAML file (if `CONFIG_PATH` env is set) or environment variables.
- Binds env vars explicitly with `viper.MustBindEnv("http.port", "HTTP_PORT")`.
- Provides sub-configs via fx: `fx.Provide(func(app App) http.Config { return app.HTTP })`.

## 7. Observability

### Probe Interface Pattern
- Define a `Probe` interface in the domain package with business-meaningful method names (`HabitCreated()`, `FailedToCreateHabit(error)`).
- **PromProbe**: Implements `Probe` with Prometheus counters/gauges + structured Zap logging.
- **NopProbe**: Empty implementation for tests.
- Metric names prefixed with app name: `astro_token_created`, `astro_request`.

### Logging
- **Uber Zap** for structured logging.
- `logger.NopLogger` (fx option) to disable logging in tests.
- Log errors at the controller/adapter level, not in the domain.

### Health Checks
- `health.Service` aggregates checks from all adapters.
- `health.Controller` returns 200 if all checks pass, 503 otherwise.
- Health status modeled as domain types (`Status`, `Check`).

## 8. Testing

### Framework
- **Ginkgo v2** for BDD-style test organization (`Describe`, `It`, `BeforeEach`).
- **Gomega** for assertions (`Expect(x).To(Equal(y))`).
- Use generated mocks only for focused adapter contract tests where the third-party call itself is the observable contract. Use Fakes for owned ports.

### Integration Test Bootstrap
Full application startup via `fxtest.New`:

```go
fxApp = fxtest.New(
    GinkgoT(),
    logger.NopLogger,
    test.NewPortAppConfig,
    habit.NopProbeProvider,
    config.Module,
    postgres.Module,
    habit.Module,
    transaction.Module,
).RequireStart()
```

### Test Isolation
- **Transaction rollback module** (`test/transaction/`): Wraps each test in a DB transaction and rolls back on stop. Uses `fx.Decorate` to replace the `*gorm.DB` with a transactional one.
- **Dynamic port allocation** (`test/new_port_app_config.go`): Pre-allocates unique ports for parallel test execution.

### Test Driver Pattern
- `test/driver/` provides an HTTP API client (`Driver`) that wraps the application's endpoints.
- High-level methods: `MustCreate("read")`, `MustList()`, `MustDelete()`.
- Low-level `API` struct for raw HTTP requests when testing error cases.
- `test/req/` provides an HTTP request builder.

### Test Matchers
- `test/matchers/` provides generic helpers: `Must2[T](val T, err error) T` that asserts no error and returns the value.

## 9. Naming Conventions

### Variables & Receivers
- **Short receiver names**: `c` for Controller, `s` or `service` for Service, `repo` for Repository.
- **Short-lived variables**: `h` for habit, `err` for error, `ctx` for context.
- **Descriptive for longer scope**: `userID`, `habitID`, `controller`.

### Interfaces
- Named as agent nouns or capabilities: `Repository`, `Service`, `Probe`, `Checker`, `Encrypter`, `Encoder`.
- Single responsibility: `HabitRepository` (not `HabitAndActivityRepository`).

### Constructors
- `New<Type>` pattern: `NewHabitService`, `NewController`, `NewPromProbe`.

### Import Organization
1. Standard library
2. Blank line
3. Internal project imports
4. Blank line
5. External third-party imports

## 10. Concurrency
- **Minimal and explicit**: Use goroutines and channels when concurrency is required and ownership, cancellation, and shutdown are clear.
- **Context propagation**: Pass `context.Context` through I/O call paths for cancellation and deadlines. `repo.orm.WithContext(ctx)` on every GORM call.

## 11. Database Migrations
- **Goose** for migration management.
- Separate `cmd/migrate/` entry point.
- Migrations fail on unexpected schema state. Use idempotent DDL only when rerun semantics are an explicit requirement.

## 12. Build System
- **Mage** for build tasks (defined in `magefiles/`).
