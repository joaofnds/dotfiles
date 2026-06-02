{ pkgs, ... }:
{
  environment.systemPackages = [
    pkgs.difftastic
    pkgs.gitu
    pkgs.go-grip
    pkgs.shfmt
    pkgs.sqruff
    pkgs.texliveFull
    pkgs.yt-dlp
  ];

  homebrew.casks = [
    "audacity"
  ];
}
