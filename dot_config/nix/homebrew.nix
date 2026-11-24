{ ... }:
{
  homebrew = {
    enable = true;
    enableZshIntegration = true;

    taps = [ "joaofnds/tap" ];

    brews = [ "ruby" ];

    casks = [
      "brave-browser"
      "claude-code@latest"
      "codex"
      "font-computer-modern"
      "font-iosevka-aile"
      "font-iosevka-ss08"
      "ghostty"
      "joaofnds/tap/trunk"
      "mongodb-compass"
      "obsidian"
      "orbstack"
      "peel"
      "raycast"
      "t3-code"
      "zed"
    ];
  };
}
