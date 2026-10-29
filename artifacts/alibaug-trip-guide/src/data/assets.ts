const base=import.meta.env.BASE_URL;
export const characterAssets={
 looking:`${base}graphics/characters/looking.png`,
 lessgoo:`${base}graphics/characters/lessgoo.png`,
 happy:`${base}graphics/characters/happy.png`,
 kiss:`${base}graphics/characters/kiss.png`,
 driving:`${base}graphics/characters/driving.png`,
 parked:`${base}graphics/characters/parked.png`
} as const;
export type CharacterPose=keyof typeof characterAssets;
export const optionalPlaceArt=(id:string)=>`${base}graphics/places/place-${id}.webp`;
export const optionalStampArt=(id:string)=>`${base}graphics/places/stamp-${id}.webp`;
