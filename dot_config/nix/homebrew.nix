{ ... }:
{
  homebrew = {
    enable = true;
    enableZshIntegration = true;

    taps = [ "joaofnds/tap" ];

    brews = [
      "ruby"
      "opencode"
    ];

    casks = [
      "brave-browser"
      "chatgpt"
      "claude"
      "claude-code@latest"
      "codex"
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
      "peel"
      "raycast"
      "setapp"
      "shottr"
      "soundsource"
      "spotify"
      "tailscale-app"
      "the-unarchiver"
      "vlc"
      "zed"
    ];

    masApps = {
      Magnet = 441258766;
    };
  };
}
