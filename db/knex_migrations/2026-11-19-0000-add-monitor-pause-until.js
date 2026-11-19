exports.up = function (knex) {
    return knex.schema.alterTable("monitor", function (table) {
        table.datetime("pause_until").nullable().defaultTo(null);
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("monitor", function (table) {
        table.dropColumn("pause_until");
    });
};
