{ ... }:
{
  homebrew = {
    enable = true;
    enableZshIntegration = true;

    taps = [
      "d12frosted/emacs-plus"
      "joaofnds/tap"
    ];

    brews = [
      "d12frosted/emacs-plus/emacs-plus@30"
    ];

    casks = [
      "appcleaner"
      "brave-browser"
      "claude-code@latest"
      "font-computer-modern"
      "font-iosevka-aile"
      "font-iosevka-ss08"
      "ghostty"
      "handy"
      "joaofnds/tap/astro"
      "joaofnds/tap/trunk"
      "logi-options+"
      "obsidian"
      "orbstack"
      "raycast"
      "setapp"
      "shottr"
      "soundsource"
      "spotify"
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
