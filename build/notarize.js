const { notarize } = require('@electron/notarize');
const path = require('path');

module.exports = async function afterSign(context) {
  if (process.platform !== 'darwin') return;

  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !teamId) {
    console.warn('⚠️  Notarization skipped: set APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);

  await notarize({
    appPath,
    appleId,
    appleIdPassword,
    teamId,
  });
};
