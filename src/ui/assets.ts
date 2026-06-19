export const visualAssets = {
  styleConcept: "/assets/GameStyleConcept.png",
  uiAssetKit: "/assets/spritesheets/UI_AssetKit.png",
  uiAssetSheet: "/assets/spritesheets/UI_AssetSheet.png",
  uiIcons: "/assets/spritesheets/UI_Icons.png",
  uiKitMockup: "/assets/spritesheets/UI_Kit_Mockup.png"
};

export type SpriteSheetKey = "actions" | "players" | "tokens" | "dice";

export const pendingSpriteSheets: Record<SpriteSheetKey, string | undefined> = {
  actions: visualAssets.uiIcons,
  players: visualAssets.uiAssetSheet,
  tokens: visualAssets.uiAssetKit,
  dice: visualAssets.uiAssetKit
};
