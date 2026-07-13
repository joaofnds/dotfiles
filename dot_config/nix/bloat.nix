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
    "focusrite-control-2"
    "insta360-link-controller"
    "pop-app"
  ];
}
