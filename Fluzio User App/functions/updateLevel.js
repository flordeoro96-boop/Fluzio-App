const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

// This function updates a business's subscription level
exports.updateBusinessSubscriptionLevel = onRequest({
  cors: true,
  invoker: 'public'
}, async (req, res) => {
  try {
    const { userId, level } = req.body;
    
    if (!userId || !level) {
      return res.status(400).json({ error: 'Missing userId or level' });
    }
    
    const db = admin.firestore();
    
    await db.collection('users').doc(userId).update({
      level: parseInt(level),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get updated user
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    res.json({
      success: true,
      message: `Updated subscription level to ${level}`,
      data: {
        level: userData.level,
        businessLevel: userData.businessLevel,
        businessSubLevel: userData.businessSubLevel
      }
    });
  } catch (error) {
    console.error('Error updating subscription level:', error);
    res.status(500).json({ error: error.message });
  }
});
