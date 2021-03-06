import Knex from 'knex';

import config from '#config';
import { generateKnexConfig } from '#knexfile';
import log from '#lib/logger';

const knexMain = {};
const knexTenant = {};

const knexLog = {
  warn(msg) {
    log.warn(msg);
  },
  error(msg) {
    log.error(msg);
  },
  deprecate(msg) {
    log.warn(msg);
  },
  debug(msg) {
    if (msg.method === 'columnInfo') return;
    const sqlString = msg.bindings.reduce((sql, value) => sql.replace('?', value), msg.sql);
    log.sql(`${msg.method} => ${sqlString}`);
  },
};

for (let key in config.db) {
  const knexConfig = generateKnexConfig(config.db[key], key);
  knexConfig.log = knexLog;
  knexMain[key] = Knex(knexConfig);
}

// ^ this is only usefull to implement if you're going to implement multi-tenancy
// ? this will depend on whether same db or different db architecture
// TODO : fix this to implement getting the correct config info for a tenant
const getTenantConfig = async (tenant) => {
  return {};
};

const getMainKnexInstance = (dbKey) => {
  return knexMain[dbKey];
};

const getTenantKnexInstance = async (tenant) => {
  let knexInstance = knexTenant[tenant];
  if (knexInstance === undefined) {
    const tenantConfig = await getTenantConfig(tenant);
    const knexConfig = generateKnexConfig(tenantConfig, 99);
    knexConfig.log = knexLog;
    knexTenant[tenant] = knexInstance = Knex(knexConfig);
  }
  return knexInstance;
};

delete config.db;

export { knexMain, getTenantKnexInstance, getMainKnexInstance };
