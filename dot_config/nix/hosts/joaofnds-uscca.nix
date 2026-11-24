{ ... }:
{
  networking.computerName = "joaofnds-uscca";
  networking.localHostName = "joaofnds-uscca";
  system.primaryUser = "joao.fernandes";

  system.defaults.dock.persistent-apps = [
    "/Applications/Brave Browser.app"
    "/Applications/Ghostty.app"
    "/Applications/Zed.app"
    "/Applications/Trunk.app"
    "/Applications/Obsidian.app"
    "/System/Applications/Mail.app"
    "/System/Applications/Calendar.app"
    "/System/Applications/System Settings.app"
  ];
}
