{ pkgs, ... }: {
  # Use the unstable channel to get the latest Flutter version
  channel = "unstable";

  # A list of packages to install from the specified channel.
  # You can search for packages on the NixOS package search:
  # https://search.nixos.org/packages
  packages = [
    pkgs.flutter
  ];

  # A list of VS Code extensions to install from the Open VSX Registry.
  # You can search for extensions on the Open VSX Registry:
  # https://open-vsx.org/
  idx.extensions = [
    "dart-code.flutter"
    "dart-code.dart-code"
  ];
}
