{ pkgs, ... }:
{
  environment.systemPackages = [
    pkgs.texliveFull
    pkgs.yt-dlp
  ];

  homebrew.casks = [
    "audacity"
  ];
}
