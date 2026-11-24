{ ... }:
{
  networking.computerName = "joaofnds-delta";
  networking.localHostName = "joaofnds-delta";
  system.primaryUser = "joaofnds";

  system.defaults.dock.persistent-apps = [
    "/System/Volumes/Preboot/Cryptexes/App/System/Applications/Safari.app"
    "/Applications/Brave Browser.app"
    "/Applications/Ghostty.app"
    "/Applications/Zed.app"
    "/Applications/Trunk.app"
    "/Applications/Claude.app"
    "/Applications/Obsidian.app"
    "/System/Applications/Messages.app"
    "/System/Applications/Mail.app"
    "/System/Applications/Calendar.app"
    "/Applications/Spotify.app"
    "/System/Applications/System Settings.app"
  ];

  homebrew = {
    casks = [
      "handy"
      "joaofnds/tap/astro"
      "openlogi"
      "setapp"
      "shottr"
      "soundsource"
      "spotify"
      "tailscale-app"
      "the-unarchiver"
      "vlc"
    ];
  };
}
