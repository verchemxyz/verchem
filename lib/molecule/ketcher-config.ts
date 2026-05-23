import { StandaloneStructServiceProvider } from 'ketcher-standalone';

export const structServiceProvider = new StandaloneStructServiceProvider();

/**
 * Base URL for Ketcher static resources (templates, fonts, etc.)
 * Empty string resolves to the application root.
 */
export const staticResourcesUrl = '';
