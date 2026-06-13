const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const db = new Database(dbPath);

const updates = [
  // Garena ROV
  { id: 'rov_cat_topup_r00011', price: 10, position: 0 },
  { id: 'rov_cat_topup_r00024', price: 20, position: 1 },
  { id: 'rov_cat_topup_r00060', price: 50, position: 2 },
  { id: 'rov_cat_topup_r00110', price: 90, position: 3 },
  { id: 'rov_cat_topup_r00185', price: 145, position: 4 },
  { id: 'rov_cat_topup_r00209', price: 166, position: 5 },
  { id: 'rov_cat_topup_r00257', price: 205, position: 6 },
  { id: 'rov_cat_topup_r00295', price: 230, position: 7 },
  { id: 'rov_cat_topup_r00307', price: 245, position: 8 },
  { id: 'rov_cat_topup_r00370', price: 290, position: 9 },
  { id: 'rov_cat_topup_r00406', price: 320, position: 10 },
  { id: 'rov_cat_topup_r00504', price: 395, position: 11 },
  { id: 'rov_cat_topup_r00555', price: 435, position: 12 },
  { id: 'rov_cat_topup_r00620', price: 480, position: 13 },
  { id: 'rov_cat_topup_r00704', price: 550, position: 14 },
  { id: 'rov_cat_topup_r00805', price: 635, position: 15 },
  { id: 'rov_cat_topup_r00915', price: 735, position: 16 },
  { id: 'rov_cat_topup_r01240', price: 955, position: 17 },
  { id: 'rov_cat_topup_r01860', price: 1440, position: 18 },
  { id: 'rov_cat_topup_r02230', price: 1770, position: 19 },
  { id: 'rov_cat_topup_r02480', price: 1950, position: 20 },
  { id: 'rov_cat_topup_r02850', price: 2250, position: 21 },
  { id: 'rov_cat_topup_r03100', price: 2470, position: 22 },
  { id: 'rov_cat_topup_r03160', price: 2485, position: 23 },
  { id: 'rov_cat_topup_r03604', price: 2860, position: 24 },
  { id: 'rov_cat_topup_r04090', price: 3250, position: 25 },
  { id: 'rov_cat_topup_r03830', price: 3000, position: 26 },
  { id: 'rov_cat_topup_r04525', price: 3550, position: 27 },
  { id: 'rov_cat_topup_r04710', price: 3750, position: 28 },
  { id: 'rov_cat_topup_r04960', price: 3880, position: 29 },
  { id: 'rov_cat_topup_r05020', price: 3950, position: 30 },
  { id: 'rov_cat_topup_r05580', price: 4490, position: 31 },
  { id: 'rov_cat_topup_r06200', price: 4950, position: 32 },

  // Garena Free Fire
  { id: 'freefire_cat_topup_f00033', price: 10, position: 0 },
  { id: 'freefire_cat_topup_f00068', price: 20, position: 1 },
  { id: 'freefire_cat_topup_f00101', price: 39, position: 2 },
  { id: 'freefire_cat_topup_f00136', price: 42, position: 3 },
  { id: 'freefire_cat_topup_f00172', price: 50, position: 4 },
  { id: 'freefire_cat_topup_f00205', price: 60, position: 5 },
  { id: 'freefire_cat_topup_f00240', price: 69, position: 6 },
  { id: 'freefire_cat_topup_f00273', price: 82, position: 7 },
  { id: 'freefire_cat_topup_f00310', price: 88, position: 8 },
  { id: 'freefire_cat_topup_f00343', price: 106, position: 9 },
  { id: 'freefire_cat_topup_f00378', price: 111, position: 10 },
  { id: 'freefire_cat_topup_f00411', price: 119, position: 11 },
  { id: 'freefire_cat_topup_f00446', price: 128, position: 12 },
  { id: 'freefire_cat_topup_f00517', price: 150, position: 13 },
  { id: 'freefire_cat_topup_f00482', price: 136, position: 14 },
  { id: 'freefire_cat_topup_f00620', price: 1766, position: 15 },
  { id: 'freefire_cat_topup_f01224', price: 345, position: 16 },
  { id: 'freefire_cat_topup_f00690', price: 195, position: 17 },
  { id: 'freefire_cat_topup_f00862', price: 245, position: 18 },
  { id: 'freefire_cat_topup_f01052', price: 295, position: 19 },
  { id: 'freefire_cat_topup_f01362', price: 385, position: 20 },
  { id: 'freefire_cat_topup_f01801', price: 480, position: 21 },
  { id: 'freefire_cat_topup_f01973', price: 543, position: 22 },
  { id: 'freefire_cat_topup_f02111', price: 585, position: 23 },
  { id: 'freefire_cat_topup_f02318', price: 645, position: 24 },
  { id: 'freefire_cat_topup_f02853', price: 795, position: 25 },
  { id: 'freefire_cat_topup_f03698', price: 955, position: 26 },
  { id: 'freefire_cat_topup_f05499', price: 1450, position: 27 },
  { id: 'freefire_cat_topup_f07396', price: 1950, position: 28 },
  { id: 'freefire_cat_topup_f09197', price: 2450, position: 29 },
  { id: 'freefire_cat_topup_f11094', price: 2950, position: 30 },
  { id: 'freefire_cat_topup_f18490', price: 4950, position: 31 },
  { id: 'freefire_cat_topup_fdim32', price: 35, position: 32 },
  { id: 'freefire_cat_topup_fdim63', price: 66, position: 33 },
  { id: 'freefire_cat_topup_fbpc84', price: 88, position: 34 },
  { id: 'freefire_cat_topup_fmon280', price: 295, position: 35 },

  // Garena Undawn
  { id: 'undawn_cat_topup_u00055', price: 20, position: 0 },
  { id: 'undawn_cat_topup_u00138', price: 50, position: 1 },
  { id: 'undawn_cat_topup_u00253', price: 88, position: 2 },
  { id: 'undawn_cat_topup_u00440', price: 145, position: 3 },
  { id: 'undawn_cat_topup_u00880', price: 290, position: 4 },
  { id: 'undawn_cat_topup_u01485', price: 495, position: 5 },
  { id: 'undawn_cat_topup_u02970', price: 990, position: 6 },
  { id: 'undawn_cat_topup_u04510', price: 1490, position: 7 },
  { id: 'undawn_cat_topup_u06050', price: 1950, position: 8 },
  { id: 'undawn_cat_topup_u09218', price: 2950, position: 9 },
  { id: 'undawn_cat_topup_u15642', price: 4950, position: 10 },
  { id: 'undawn_cat_topup_uace379', price: 365, position: 11 },
  { id: 'undawn_cat_topup_uglo379', price: 365, position: 12 },
  { id: 'undawn_cat_topup_upro349', price: 340, position: 13 },
  { id: 'undawn_cat_topup_ubig269', price: 260, position: 14 },
  { id: 'undawn_cat_topup_umon129', price: 125, position: 15 },
  { id: 'undawn_cat_topup_uweek79', price: 78, position: 16 },

  // Call of Duty Mobile
  { id: 'codm_cat_topup_c00048', price: 20, position: 0 },
  { id: 'codm_cat_topup_c00126', price: 50, position: 1 },
  { id: 'codm_cat_topup_c00227', price: 89, position: 2 },
  { id: 'codm_cat_topup_c00252', price: 99, position: 3 },
  { id: 'codm_cat_topup_c00378', price: 147, position: 4 },
  { id: 'codm_cat_topup_c00792', price: 299, position: 5 },
  { id: 'codm_cat_topup_c01440', price: 489, position: 6 },
  { id: 'codm_cat_topup_c03000', price: 995, position: 7 },

  // Delta Force
  { id: 'deltaforce_cat_topup_d00019', price: 10, position: 0 },
  { id: 'deltaforce_cat_topup_d00032', price: 17, position: 1 },
  { id: 'deltaforce_cat_topup_d00063', price: 35, position: 2 },
  { id: 'deltaforce_cat_topup_d00336', price: 170, position: 3 },
  { id: 'deltaforce_cat_topup_d00482', price: 240, position: 4 },
  { id: 'deltaforce_cat_topup_d00785', price: 340, position: 5 },
  { id: 'deltaforce_cat_topup_d01544', price: 685, position: 6 },
  { id: 'deltaforce_cat_topup_d016848', price: 6850, position: 7 },
  { id: 'deltaforce_cat_topup_d02065', price: 8399, position: 8 },
  { id: 'deltaforce_cat_topup_d04114', price: 1699, position: 9 },
  { id: 'deltaforce_cat_topup_d08424', price: 3400, position: 10 },
  { id: 'deltaforce_cat_topup_d025272', price: 9999, position: 11 },
  { id: 'deltaforce_cat_topup_dmsa110', price: 72, position: 12 },
  { id: 'deltaforce_cat_topup_dms0036', price: 24.68, position: 13 },
];

try {
  const updateStmt = db.prepare("UPDATE ProductOption SET price = ?, position = ? WHERE id = ?");
  
  db.transaction(() => {
    for (const item of updates) {
      const result = updateStmt.run(item.price, item.position, item.id);
      if (result.changes > 0) {
        console.log(`Updated Option ${item.id} -> Price: ${item.price}, Position: ${item.position}`);
      } else {
        console.log(`Warning: Option ${item.id} not found in database.`);
      }
    }
  })();
  
  console.log("Database update completed successfully!");
} catch (err) {
  console.error('Error during transaction:', err.message);
} finally {
  db.close();
}
