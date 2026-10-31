import {execFileSync} from "node:child_process";
import {readFileSync, readdirSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

export type SelectionColors = {background: string; color: string};

let linuxSelectionColors: SelectionColors | undefined;

function getGtkThemeName(): string | undefined {
  const gtkTheme = process.env.GTK_THEME?.split(":", 1)[0];
  if (gtkTheme !== undefined && gtkTheme !== "") {
    return gtkTheme;
  }

  try {
    return execFileSync(
      "gsettings",
      ["get", "org.gnome.desktop.interface", "gtk-theme"],
      {encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]},
    )
      .trim()
      .replaceAll(/^'|'$/gv, "");
  } catch {
    return undefined;
  }
}

function getCssFiles(directory: string): string[] {
  const cssFiles: string[] = [];
  const directories = [{path: directory, depth: 2}];

  while (directories.length > 0) {
    const current = directories.pop()!;
    let entries;
    try {
      entries = readdirSync(current.path, {withFileTypes: true});
    } catch {
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(current.path, entry.name);
      if (entry.isDirectory() && current.depth > 0) {
        directories.push({path: entryPath, depth: current.depth - 1});
      } else if (entry.isFile() && entry.name.endsWith(".css")) {
        cssFiles.push(entryPath);
      }
    }
  }

  return cssFiles;
}

function resolveThemeColor(
  name: string,
  definitions: Map<string, string>,
  visited = new Set<string>(),
): string | undefined {
  let colorName = name;
  while (!visited.has(colorName)) {
    visited.add(colorName);
    const value = definitions.get(colorName)?.trim();
    if (value === undefined) {
      return undefined;
    }

    const alias = /^@(?<name>[\w\u{2D}]+)$/v.exec(value);
    if (alias !== null) {
      colorName = alias.groups!.name!;
      continue;
    }

    return /^(?:#[\da-f]{3,8}|rgba?\([^;]+\))$/iv.test(value)
      ? value
      : undefined;
  }

  return undefined;
}

function addCssDefinitions(
  cssFile: string,
  definitions: Map<string, string>,
): void {
  let css: string;
  try {
    css = readFileSync(cssFile, "utf8");
  } catch {
    return;
  }

  for (const declaration of css.split(";")) {
    const trimmedDeclaration = declaration.trim();
    const match = /^@define-color\s+(?<name>[\w\u{2D}]+)\s+/v.exec(
      trimmedDeclaration,
    );
    if (match !== null) {
      definitions.set(
        match.groups!.name!,
        trimmedDeclaration.slice(match[0].length).trim(),
      );
    }
  }
}

export function getLinuxSelectionColors(): SelectionColors | undefined {
  if (linuxSelectionColors !== undefined) {
    return linuxSelectionColors;
  }

  const themeName = getGtkThemeName();
  if (themeName === undefined) {
    return undefined;
  }

  const themeDirectories = [
    path.join(os.homedir(), ".themes", themeName, "gtk-3.0"),
    path.join(os.homedir(), ".local", "share", "themes", themeName, "gtk-3.0"),
    path.join("/usr/local/share/themes", themeName, "gtk-3.0"),
    path.join("/usr/share/themes", themeName, "gtk-3.0"),
  ];
  const definitions = new Map<string, string>();

  for (const directory of themeDirectories) {
    for (const cssFile of getCssFiles(directory)) {
      addCssDefinitions(cssFile, definitions);
    }
  }

  const background =
    resolveThemeColor("theme_selected_bg_color", definitions) ??
    resolveThemeColor("selected_bg_color", definitions);
  if (background === undefined) {
    return undefined;
  }

  linuxSelectionColors = {
    background,
    color:
      resolveThemeColor("theme_selected_fg_color", definitions) ??
      resolveThemeColor("selected_fg_color", definitions) ??
      "HighlightText",
  };
  return linuxSelectionColors;
}
