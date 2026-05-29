import { defineConfig, type WorkspaceOptions } from 'sanity';
import { presentationTool } from 'sanity/presentation';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { deskStructure } from './deskStructure';
import { resolve } from './presentation/resolve';
import { schemaTypes } from './schemas';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const previewOrigin = process.env.SANITY_STUDIO_PREVIEW_ORIGIN ?? 'http://localhost:5173';

const sharedAuth = {
	loginMethod: 'dual' as const
};

const sharedWorkspace: Pick<
	WorkspaceOptions,
	'projectId' | 'auth' | 'plugins' | 'schema'
> = {
	projectId,
	auth: sharedAuth,
	plugins: [
		structureTool({ structure: deskStructure }),
		presentationTool({
			resolve,
			previewUrl: {
				initial: previewOrigin,
				previewMode: {
					enable: '/preview/enable',
					disable: '/preview/disable'
				}
			},
			allowOrigins: [previewOrigin, 'http://localhost:*', 'https://*.vercel.app']
		}),
		visionTool()
	],
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
