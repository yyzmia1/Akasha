/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("sync_items");
  if (!collection) return;

  // 严格限定创建与更新时的 user 归属，禁止客户端篡改所有者 ID
  collection.createRule = "@request.auth.id != '' && user = @request.auth.id";
  collection.updateRule = "@request.auth.id != '' && user = @request.auth.id && (@request.data.user:isset = false || @request.data.user = @request.auth.id)";
  collection.deleteRule = "@request.auth.id != '' && user = @request.auth.id";

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("sync_items");
    if (collection) {
      collection.updateRule = "@request.auth.id != '' && user = @request.auth.id";
      return app.save(collection);
    }
  } catch (_e) {}
});
