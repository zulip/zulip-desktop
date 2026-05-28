{
  description = "Zulip Desktop";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      inherit (pkgs) lib;

      electron = pkgs.electron_42;
      pnpm = pkgs.pnpm_10_29_2;

      zulip = pkgs.stdenv.mkDerivation (finalAttrs: {
        pname = "zulip";
        version = "5.12.3";

        src = self;

        pnpmDeps = pkgs.fetchPnpmDeps {
          inherit (finalAttrs) pname version src;
          inherit pnpm;
          fetcherVersion = 3;
          hash = "sha256-499EPuTSrX2BhWHPNce1fwuf5tqSgS2VbedSKsKlxLo=";
        };

        nativeBuildInputs = [
          pkgs.nodejs
          pnpm
          pkgs.pnpmConfigHook
          pkgs.makeBinaryWrapper
          pkgs.copyDesktopItems
          pkgs.python3
        ];

        buildPhase = ''
          runHook preBuild

          npm_config_nodedir=${electron.headers} \
            node --run pack -- \
            -c.electronDist=${electron.dist} \
            -c.electronVersion=${electron.version}

          runHook postBuild
        '';

        installPhase = ''
          runHook preInstall

          mkdir -p "$out/share/lib/zulip"
          cp -r dist/*-unpacked/resources/app.asar* "$out/share/lib/zulip/"

          install -m 444 -D app/resources/zulip.png \
            $out/share/icons/hicolor/512x512/apps/zulip.png

          makeBinaryWrapper '${lib.getExe electron}' "$out/bin/zulip" \
            --add-flags "$out/share/lib/zulip/app.asar" \
            --inherit-argv0

          runHook postInstall
        '';

        desktopItems = [
          (pkgs.makeDesktopItem {
            name = "zulip";
            exec = "zulip %U";
            icon = "zulip";
            desktopName = "Zulip";
            comment = "Zulip Desktop Client for Linux";
            categories = [
              "Chat"
              "Network"
              "InstantMessaging"
            ];
            startupWMClass = "Zulip";
            terminal = false;
          })
        ];

        meta = {
          description = "Desktop client for Zulip Chat";
          homepage = "https://zulip.com";
          license = lib.licenses.asl20;
          platforms = lib.platforms.linux;
          mainProgram = "zulip";
        };
      });
    in
    {
      packages.${system} = {
        inherit zulip;
        default = zulip;
      };
    };
}
