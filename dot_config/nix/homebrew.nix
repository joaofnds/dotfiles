{ ... }:
{
  homebrew = {
    enable = true;
    enableZshIntegration = true;

    taps = [ "joaofnds/tap" ];

    casks = [
      "appcleaner"
      "brave-browser"
      "claude"
      "claude-code@latest"
      "font-computer-modern"
      "font-iosevka-aile"
      "font-iosevka-ss08"
      "ghostty"
      "handy"
      "joaofnds/tap/astro"
      "joaofnds/tap/trunk"
      "logi-options+"
      "mongodb-compass"
      "obsidian"
      "orbstack"
      "raycast"
      "setapp"
      "shottr"
      "soundsource"
      "spotify"
      "tailscale-app"
      "the-unarchiver"
      "visual-studio-code"
      "vlc"
      "zed"
    ];

    masApps = {
      Magnet = 441258766;
    };
  };
}
