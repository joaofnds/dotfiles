{ pkgs, ... }:
{
  networking.computerName = "joaofnds-m5p";
  networking.localHostName = "joaofnds-m5p";
  system.primaryUser = "joaofnds";

  environment.systemPackages = [
    pkgs.emacs
    pkgs.flyctl
    pkgs.restic
  ];

  system.defaults.dock.persistent-apps = [
    "/System/Volumes/Preboot/Cryptexes/App/System/Applications/Safari.app"
    "/Applications/Brave Browser.app"
    "/Applications/Ghostty.app"
    "/System/Volumes/Data/Applications/Nix Apps/Emacs.app"
    "/Applications/Zed.app"
    "/Applications/Trunk.app"
    "/Applications/Claude.app"
    "/Applications/Obsidian.app"
    "/System/Applications/Messages.app"
    "/System/Applications/Mail.app"
    "/System/Applications/Calendar.app"
    "/Applications/Spotify.app"
    "/System/Applications/iPhone Mirroring.app"
    "/System/Applications/System Settings.app"
  ];

  homebrew = {
    casks = [
      "chatgpt"
      "claude"
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

    masApps = {
      Magnet = 441258766;
    };
  };
}
