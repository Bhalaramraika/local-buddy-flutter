
{ pkgs, ... }: {
  # The nixpkgs channel to use.
  channel = "stable-24.11";

  # A list of packages to install from the specified channel.
  packages = [
    pkgs.nodejs_22
  ];

  # A list of VS Code extensions to install from the Open VSX Registry.
  idx.extensions = [
    "esbenp.prettier-vscode"
  ];

  # Workspace lifecycle hooks.
  idx.workspace = {
    # Runs when a workspace is first created.
    onCreate = {
      install-expo = "npm install -g expo-cli";
    };
  };
}
