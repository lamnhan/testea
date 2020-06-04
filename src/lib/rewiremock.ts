import rewiremock, {addPlugin, plugins} from 'rewiremock';

rewiremock.overrideEntryPoint(module);
addPlugin(plugins.nodejs);

export {rewiremock};
