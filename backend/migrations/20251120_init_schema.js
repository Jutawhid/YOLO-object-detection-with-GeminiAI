// backend/migrations/20251120_init_schema.js
export async function up(knex) {
  // users
  await knex.schema.createTable("users", (t) => {
    t.bigIncrements("id").unsigned().primary();
    t.string("email", 255).notNullable().unique();
    t.string("password_hash", 255).notNullable();
    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  // images
  await knex.schema.createTable("images", (t) => {
    t.bigIncrements("id").unsigned().primary();
    t.bigInteger("user_id").unsigned().notNullable().index();
    t.string("filename", 255).notNullable();
    t.string("path", 1024).notNullable();
    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    t.foreign("user_id")
      .references("users.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });

  // detections
  await knex.schema.createTable("detections", (t) => {
    t.bigIncrements("id").unsigned().primary();
    t.bigInteger("image_id").unsigned().notNullable().index();
    t.string("class_name", 255).notNullable();
    t.integer("x").notNullable();
    t.integer("y").notNullable();
    t.integer("w").notNullable();
    t.integer("h").notNullable();
    t.decimal("confidence", 5, 4).notNullable();
    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    t.foreign("image_id")
      .references("images.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    t.index(["class_name"]);
  });

  // qa_messages
  await knex.schema.createTable("qa_messages", (t) => {
    t.bigIncrements("id").unsigned().primary();
    t.bigInteger("image_id").unsigned().notNullable().index();
    t.bigInteger("user_id").unsigned().notNullable().index();
    t.text("question").notNullable();
    t.text("answer").nullable();
    t.json("metadata").nullable();
    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    t.foreign("image_id")
      .references("images.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    t.foreign("user_id")
      .references("users.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("qa_messages");
  await knex.schema.dropTableIfExists("detections");
  await knex.schema.dropTableIfExists("images");
  await knex.schema.dropTableIfExists("users");
}
