{ ... }:
{
  networking.dns = [
    "1.1.1.1"
    "1.0.0.1"
  ];
  networking.knownNetworkServices = [
    "Wi-Fi"
    "Ethernet"
    "Thunderbolt Bridge"
  ];

  system.keyboard.enableKeyMapping = true;
  system.keyboard.remapCapsLockToEscape = true;

  system.defaults = {
    NSGlobalDomain = {
      ApplePressAndHoldEnabled = false;
      AppleShowScrollBars = "WhenScrolling";
      AppleMeasurementUnits = "Centimeters";
      AppleTemperatureUnit = "Celsius";
      AppleMetricUnits = 1;
      InitialKeyRepeat = 15;
      KeyRepeat = 2;
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
      persistent-apps = [
        "/System/Volumes/Preboot/Cryptexes/App/System/Applications/Safari.app"
        "/Applications/Brave Browser.app"
        "/Applications/Ghostty.app"
        "/Applications/Visual Studio Code.app"
        "/Applications/Zed.app"
        "/Applications/Obsidian.app"
        "/System/Applications/Messages.app"
        "/System/Applications/Mail.app"
        "/System/Applications/Calendar.app"
        "/Applications/Spotify.app"
        "/System/Applications/iPhone Mirroring.app"
        "/System/Applications/System Settings.app"
      ];
    };

    finder = {
      AppleShowAllExtensions = true;
      FXEnableExtensionChangeWarning = true;
      FXPreferredViewStyle = "clmv";
      NewWindowTarget = "Home";
      ShowPathbar = true;
      _FXSortFoldersFirst = true;
      _FXSortFoldersFirstOnDesktop = true;
    };

    iCal = {
      "first day of week" = "Monday";
    };

    CustomUserPreferences = {
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
