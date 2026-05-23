import { defineConfig, type WorkspaceOptions } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { deskStructure } from './deskStructure';
import { schemaTypes } from './schemas';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';

const sharedWorkspace: Pick<
	WorkspaceOptions,
	'projectId' | 'plugins' | 'schema'
> = {
	projectId,
	plugins: [structureTool({ structure: deskStructure }), visionTool()],
	schema: {
		types: schemaTypes
	}
};

export default defineConfig([
	{
		...sharedWorkspace,
		name: 'production',
		title: 'Golf Homes International',
		subtitle: 'Production',
		dataset: 'production',
		basePath: '/production'
	},
	{
		...sharedWorkspace,
		name: 'development',
		title: 'Golf Homes International',
		subtitle: 'Development',
		dataset: 'development',
		basePath: '/development'
	}
]);
