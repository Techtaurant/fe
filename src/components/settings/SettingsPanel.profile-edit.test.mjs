import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const settingsPanelSource = readFileSync(
  new URL("./SettingsPanel.tsx", import.meta.url),
  "utf8",
);

const settingsModalSource = readFileSync(
  new URL("./SettingsModal.tsx", import.meta.url),
  "utf8",
);

test("settings management profile row opens the profile edit modal through a body portal", () => {
  assert.match(
    settingsPanelSource,
    /import ProfileEditModal from "\.\.\/user\/ProfileEditModal";/,
  );
  assert.match(
    settingsPanelSource,
    /import \{ createPortal \} from "react-dom";/,
  );
  assert.match(
    settingsPanelSource,
    /document\.body/,
  );
  assert.match(
    settingsPanelSource,
    /user && isProfileEditModalOpen && [a-zA-Z]+ &&\s*createPortal\(/,
  );
  assert.doesNotMatch(settingsPanelSource, /\{user \? \(\s*<ProfileEditModal/);
});

test("settings modal keeps parent dismissal disabled while profile editor is open", () => {
  assert.match(
    settingsPanelSource,
    /onProfileEditOpenChange\?\.\(isProfileEditModalOpen\);/,
  );
  assert.match(
    settingsModalSource,
    /closeOnBackdrop=\{!isProfileEditModalOpen\}/,
  );
  assert.match(
    settingsModalSource,
    /closeOnEscape=\{!isProfileEditModalOpen\}/,
  );
});
