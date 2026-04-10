{
  description = "Example nix-darwin system flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    nix-darwin.url = "github:nix-darwin/nix-darwin/master";
    nix-darwin.inputs.nixpkgs.follows = "nixpkgs";
    nix-homebrew.url = "github:zhaofengli/nix-homebrew";
  };

  outputs =
    inputs@{
      self,
      nix-darwin,
      nixpkgs,
      nix-homebrew,
    }:
    let
      configuration =
        { pkgs, ... }:
        {
          nix.enable = false;
          nix.settings.experimental-features = "nix-command flakes";
          nixpkgs.hostPlatform = "aarch64-darwin";
          programs.zsh.enable = true;
          security.pam.services.sudo_local.touchIdAuth = true;
          system.configurationRevision = self.rev or self.dirtyRev or null;
          system.primaryUser = "joaofnds";
          system.stateVersion = 6;
        };
    in
    {
      darwinConfigurations."joaofnds-m1p" = nix-darwin.lib.darwinSystem {
        modules = [
          configuration
          ./system-defaults.nix
          ./packages.nix
          ./homebrew.nix
          nix-homebrew.darwinModules.nix-homebrew
          {
            nix-homebrew = {
              enable = true;
              enableRosetta = false;
              user = "joaofnds";
            };
          }
        ];
      };
    };
}
