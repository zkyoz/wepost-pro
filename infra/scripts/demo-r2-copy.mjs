import { createHash } from "node:crypto";

const checksum = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Copy only inventoried, validated demo media. Never overwrite or delete data. */
export async function copyVerifiedMedia(assets, storage, apply = false) {
  const prepared = [];
  for (const asset of assets) {
    const local = await storage.readLocal(asset.storage_key);
    if (
      !local ||
      local.length !== Number(asset.size_bytes) ||
      checksum(local) !== asset.checksum
    )
      throw new Error(`LocalMediaIntegrityMismatch:${asset.id}`);
    const remote = await storage.readRemote(asset.storage_key);
    if (
      remote &&
      (remote.length !== local.length || checksum(remote) !== asset.checksum)
    )
      throw new Error(`RemoteMediaConflict:${asset.id}`);
    prepared.push({ asset, local, exists: !!remote });
  }
  // All local files and existing destinations have been checked before the first write.
  const results = [];
  for (const { asset, local, exists } of prepared) {
    if (!exists && apply) {
      await storage.writeRemote(asset.storage_key, local, asset.mime_type);
      const verified = await storage.readRemote(asset.storage_key);
      if (
        !verified ||
        verified.length !== local.length ||
        checksum(verified) !== asset.checksum
      )
        throw new Error(`RemoteMediaVerificationFailed:${asset.id}`);
    }
    results.push({
      id: asset.id,
      bytes: local.length,
      status: exists
        ? "verified-existing"
        : apply
          ? "copied-verified"
          : "to-copy",
    });
  }
  return results;
}
