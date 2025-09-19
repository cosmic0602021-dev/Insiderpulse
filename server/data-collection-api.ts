import { Router } from 'express';
import { enhancedDataCollector } from './enhanced-data-collector.js';
import { secBulkSimple } from './sec-bulk-simple.js';

const router = Router();

// API endpoint to trigger manual data collection
router.post('/api/data-collection/trigger', async (req, res) => {
  try {
    console.log('🚀 Manual data collection triggered via API');
    await enhancedDataCollector.triggerDataCollection();

    const stats = await enhancedDataCollector.getCollectionStats();

    res.json({
      success: true,
      message: 'Data collection completed successfully',
      stats
    });
  } catch (error) {
    console.error('❌ Manual data collection failed:', error);
    res.status(500).json({
      success: false,
      message: 'Data collection failed',
      error: (error as Error).message
    });
  }
});

// API endpoint to get collection statistics
router.get('/api/data-collection/stats', async (req, res) => {
  try {
    const stats = await enhancedDataCollector.getCollectionStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Failed to get collection stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: (error as Error).message
    });
  }
});

// API endpoint to run bulk import for specific companies
router.post('/api/data-collection/bulk-import', async (req, res) => {
  try {
    const { ciks, maxPerCik = 10 } = req.body;

    if (!ciks || !Array.isArray(ciks)) {
      return res.status(400).json({
        success: false,
        message: 'CIKs array is required'
      });
    }

    console.log(`🚀 Bulk import triggered for ${ciks.length} companies`);
    await secBulkSimple.processCikList(ciks, maxPerCik);

    const stats = await enhancedDataCollector.getCollectionStats();

    res.json({
      success: true,
      message: `Bulk import completed for ${ciks.length} companies`,
      processed: ciks.length,
      stats
    });
  } catch (error) {
    console.error('❌ Bulk import failed:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk import failed',
      error: (error as Error).message
    });
  }
});

export default router;