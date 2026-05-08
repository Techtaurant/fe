import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const settingsPanelSource = readFileSync(new URL('./SettingsPanel.tsx', import.meta.url), 'utf8');

test('settings management profile row opens the profile edit modal', () => {
  assert.match(settingsPanelSource, /import ProfileEditModal from "\.\.\/user\/ProfileEditModal";/);
  assert.match(
    settingsPanelSource,
    /const \[isProfileEditModalOpen, setIsProfileEditModalOpen\] = useState\(false\);/,
  );
  assert.match(settingsPanelSource, /onClick=\{\(\) => setIsProfileEditModalOpen\(true\)\}/);
  assert.match(
    settingsPanelSource,
    /aria-label=\{`\$\{t\("management\.profile"\)\} \$\{t\("management\.edit"\)\}`\}/,
  );
  assert.match(
    settingsPanelSource,
    /<ProfileEditModal\s+isOpen=\{isProfileEditModalOpen\}\s+user=\{user\}\s+onClose=\{\(\) => setIsProfileEditModalOpen\(false\)\}/m,
  );
});
