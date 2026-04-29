{ pkgs, ... }:
{
  environment.systemPackages = [
    pkgs.shfmt
    pkgs.texliveFull
    pkgs.yt-dlp
  ];

  homebrew.casks = [
    "audacity"
  ];
}
