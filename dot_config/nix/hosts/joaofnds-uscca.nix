{ ... }:
{
  networking.computerName = "joaofnds-uscca";
  networking.localHostName = "joaofnds-uscca";
  system.primaryUser = "joao.fernandes";

  system.defaults.dock.persistent-apps = [
    "/System/Volumes/Preboot/Cryptexes/App/System/Applications/Safari.app"
    "/Applications/Brave Browser.app"
    "/Applications/Ghostty.app"
    "/Applications/Zed.app"
    "/Applications/Trunk.app"
    "/Applications/Obsidian.app"
    "/System/Applications/Messages.app"
    "/System/Applications/Mail.app"
    "/System/Applications/Calendar.app"
    "/System/Applications/iPhone Mirroring.app"
    "/System/Applications/System Settings.app"
  ];
}
