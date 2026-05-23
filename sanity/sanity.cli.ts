import { defineCliConfig } from 'sanity/cli';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const dataset = process.env.SANITY_STUDIO_DATASET ?? 'production';

export default defineCliConfig({
	api: {
		projectId,
		dataset
	},
	deployment: {
		autoUpdates: true,
		appId: 'rxbozwsb6od43gyx30d773g0'
	},
	typegen: {
		path: '../web/src/**/*.{ts,svelte}',
		schema: 'schema.json',
		generates: '../web/src/lib/sanity/types.ts',
		overloadClientMethods: true
	}
});
