import test from "tape";

import {parseCommandLine} from "../app/main/cli.ts";

test("cli: empty arguments", (t) => {
  t.deepEqual(parseCommandLine([]), {});
  t.deepEqual(parseCommandLine(["zulip"]), {});
  t.end();
});

test("cli: --dnd=value", (t) => {
  t.deepEqual(parseCommandLine(["zulip", "--dnd=true"]), {dnd: true});
  t.deepEqual(parseCommandLine(["zulip", "--dnd=false"]), {dnd: false});
  t.deepEqual(parseCommandLine(["zulip", "--dnd=toggle"]), {dnd: "toggle"});
  t.deepEqual(parseCommandLine(["zulip", "--dnd=1"]), {dnd: true});
  t.deepEqual(parseCommandLine(["zulip", "--dnd=0"]), {dnd: false});
  t.deepEqual(parseCommandLine(["zulip", "--dnd=on"]), {dnd: true});
  t.deepEqual(parseCommandLine(["zulip", "--dnd=off"]), {dnd: false});
  t.deepEqual(parseCommandLine(["zulip", "--dnd=yes"]), {dnd: true});
  t.deepEqual(parseCommandLine(["zulip", "--dnd=no"]), {dnd: false});
  t.deepEqual(parseCommandLine(["zulip", "-d=true"]), {dnd: true});
  t.deepEqual(parseCommandLine(["zulip", "-d=false"]), {dnd: false});
  t.deepEqual(parseCommandLine(["zulip", "-d=toggle"]), {dnd: "toggle"});
  t.deepEqual(parseCommandLine(["zulip", "--dnd=invalid"]), {});
  t.end();
});

test("cli: --dnd flag without value", (t) => {
  t.deepEqual(parseCommandLine(["zulip", "--dnd"]), {dnd: true});
  t.deepEqual(parseCommandLine(["zulip", "-d"]), {dnd: true});
  t.end();
});

test("cli: --dnd space-separated value", (t) => {
  t.deepEqual(parseCommandLine(["zulip", "--dnd", "true"]), {dnd: true});
  t.deepEqual(parseCommandLine(["zulip", "--dnd", "false"]), {dnd: false});
  t.deepEqual(parseCommandLine(["zulip", "--dnd", "toggle"]), {dnd: "toggle"});
  t.deepEqual(parseCommandLine(["zulip", "-d", "true"]), {dnd: true});
  t.deepEqual(parseCommandLine(["zulip", "-d", "false"]), {dnd: false});
  t.end();
});

test("cli: --no-dnd and --toggle-dnd", (t) => {
  t.deepEqual(parseCommandLine(["zulip", "--no-dnd"]), {dnd: false});
  t.deepEqual(parseCommandLine(["zulip", "--toggle-dnd"]), {dnd: "toggle"});
  t.end();
});

test("cli: focus options", (t) => {
  t.deepEqual(parseCommandLine(["zulip", "--focus"]), {focus: true});
  t.deepEqual(parseCommandLine(["zulip", "--no-focus"]), {focus: false});
  t.deepEqual(parseCommandLine(["zulip", "--dnd=true", "--focus"]), {
    dnd: true,
    focus: true,
  });
  t.deepEqual(parseCommandLine(["zulip", "--dnd=false", "--no-focus"]), {
    dnd: false,
    focus: false,
  });
  t.deepEqual(parseCommandLine(["zulip", "--dnd", "--focus"]), {
    dnd: true,
    focus: true,
  });
  t.end();
});

test("cli: help and version", (t) => {
  t.deepEqual(parseCommandLine(["zulip", "--help"]), {help: true});
  t.deepEqual(parseCommandLine(["zulip", "-h"]), {help: true});
  t.deepEqual(parseCommandLine(["zulip", "--version"]), {version: true});
  t.deepEqual(parseCommandLine(["zulip", "-v"]), {version: true});
  t.end();
});
