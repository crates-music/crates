-- Archived crates kept their handle, and crate has UNIQUE (user_id, handle), so creating
-- a crate with the name of one you'd deleted was a 500. Archiving now moves the handle
-- aside (src/api/crates.ts); this does the same for crates archived before that.
UPDATE crate
   SET handle = handle || '--archived-' || id
 WHERE state = 'ARCHIVED' AND handle NOT LIKE '%--archived-%';
