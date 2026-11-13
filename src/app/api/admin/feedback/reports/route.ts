import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CustomerFeedback from '@/models/CustomerFeedback';

const RATING_SCORE_MAP: Record<string, number> = {
  'Poor': 1,
  'Average': 2,
  'Good': 3,
  'Very Good': 4,
  'Excellent': 5,
};

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const engineerName = searchParams.get('engineerName')?.trim();
    const product = searchParams.get('product')?.trim();
    const startDate = searchParams.get('startDate')?.trim();
    const endDate = searchParams.get('endDate')?.trim();

    const query: any = { feedbackStatus: 'SUBMITTED' };

    if (engineerName && engineerName !== 'ALL') {
      query.engineerName = { $regex: engineerName, $options: 'i' };
    }
    if (product && product !== 'ALL') {
      query.$or = [
        { brandName: { $regex: product, $options: 'i' } },
        { categoryName: { $regex: product, $options: 'i' } },
      ];
    }
    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.submittedAt.$lte = end;
      }
    }

    const feedbacks = await CustomerFeedback.find(query).lean();

    const totalSubmitted = feedbacks.length;
    let positiveCount = 0; // Good, Very Good, Excellent
    let negativeCount = 0; // Poor, Average
    let overallScoreSum = 0;
    let overallScoreCount = 0;

    let installSatSum = 0;
    let installSatCount = 0;
    let callCentreSatSum = 0;
    let callCentreSatCount = 0;
    let onTimeResCount = 0;
    let onTimeResTotal = 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const engineerMap: Record<
      string,
      {
        total: number;
        attitudeSum: number;
        attitudeCount: number;
        knowledgeSum: number;
        knowledgeCount: number;
        workSatSum: number;
        workSatCount: number;
        overallSum: number;
        overallCount: number;
        punctualCount: number;
        punctualTotal: number;
        demoCount: number;
        demoTotal: number;
      }
    > = {};

    const brandMap: Record<string, { total: number; scoreSum: number }> = {};

    for (const fb of feedbacks) {
      const overall = fb.overallExperience;
      const score = RATING_SCORE_MAP[overall] || 0;

      if (score > 0) {
        overallScoreSum += score;
        overallScoreCount++;
        ratingDistribution[score] = (ratingDistribution[score] || 0) + 1;
        if (score >= 3) {
          positiveCount++;
        } else {
          negativeCount++;
        }
      }

      // Installation / Service satisfaction
      const instScore = RATING_SCORE_MAP[fb.productServiceSatisfaction] || 0;
      if (instScore > 0) {
        installSatSum += instScore;
        installSatCount++;
      }

      // Call centre satisfaction
      const ccScore = RATING_SCORE_MAP[fb.callCentreExperience] || 0;
      if (ccScore > 0) {
        callCentreSatSum += ccScore;
        callCentreSatCount++;
      }

      // On-time resolution
      if (fb.resolutionOnTime === 'Yes' || fb.resolutionOnTime === 'No') {
        onTimeResTotal++;
        if (fb.resolutionOnTime === 'Yes') onTimeResCount++;
      }

      // Engineer evaluation
      const eng = fb.engineerName || 'Unassigned';
      if (!engineerMap[eng]) {
        engineerMap[eng] = {
          total: 0,
          attitudeSum: 0,
          attitudeCount: 0,
          knowledgeSum: 0,
          knowledgeCount: 0,
          workSatSum: 0,
          workSatCount: 0,
          overallSum: 0,
          overallCount: 0,
          punctualCount: 0,
          punctualTotal: 0,
          demoCount: 0,
          demoTotal: 0,
        };
      }

      engineerMap[eng].total++;
      if (score > 0) {
        engineerMap[eng].overallSum += score;
        engineerMap[eng].overallCount++;
      }

      const attScore = RATING_SCORE_MAP[fb.engineerAttitudeRating] || 0;
      if (attScore > 0) {
        engineerMap[eng].attitudeSum += attScore;
        engineerMap[eng].attitudeCount++;
      }

      const knScore = RATING_SCORE_MAP[fb.engineerKnowledgeRating] || 0;
      if (knScore > 0) {
        engineerMap[eng].knowledgeSum += knScore;
        engineerMap[eng].knowledgeCount++;
      }

      const wsScore = RATING_SCORE_MAP[fb.workSatisfaction] || 0;
      if (wsScore > 0) {
        engineerMap[eng].workSatSum += wsScore;
        engineerMap[eng].workSatCount++;
      }

      if (fb.appointmentVisitRating === 'Yes' || fb.appointmentVisitRating === 'No') {
        engineerMap[eng].punctualTotal++;
        if (fb.appointmentVisitRating === 'Yes') engineerMap[eng].punctualCount++;
      }

      if (fb.productDemonstration === 'Yes' || fb.productDemonstration === 'No') {
        engineerMap[eng].demoTotal++;
        if (fb.productDemonstration === 'Yes') engineerMap[eng].demoCount++;
      }

      // Brand Map
      const brand = fb.brandName || 'Others';
      if (!brandMap[brand]) {
        brandMap[brand] = { total: 0, scoreSum: 0 };
      }
      brandMap[brand].total++;
      if (score > 0) brandMap[brand].scoreSum += score;
    }

    const avgOverallScore = overallScoreCount > 0 ? (overallScoreSum / overallScoreCount).toFixed(2) : '0.00';
    const positivePercentage = totalSubmitted > 0 ? ((positiveCount / totalSubmitted) * 100).toFixed(1) : '0.0';
    const negativePercentage = totalSubmitted > 0 ? ((negativeCount / totalSubmitted) * 100).toFixed(1) : '0.0';
    const avgInstallSat = installSatCount > 0 ? (installSatSum / installSatCount).toFixed(2) : '0.00';
    const avgCallCentreSat = callCentreSatCount > 0 ? (callCentreSatSum / callCentreSatCount).toFixed(2) : '0.00';
    const resolutionOnTimeRate = onTimeResTotal > 0 ? ((onTimeResCount / onTimeResTotal) * 100).toFixed(1) : '0.0';

    // Format engineer list
    const engineerReports = Object.keys(engineerMap).map((name) => {
      const e = engineerMap[name];
      return {
        name,
        totalFeedbacks: e.total,
        avgOverall: e.overallCount > 0 ? (e.overallSum / e.overallCount).toFixed(2) : '0.00',
        avgAttitude: e.attitudeCount > 0 ? (e.attitudeSum / e.attitudeCount).toFixed(2) : '0.00',
        avgKnowledge: e.knowledgeCount > 0 ? (e.knowledgeSum / e.knowledgeCount).toFixed(2) : '0.00',
        avgWorkSat: e.workSatCount > 0 ? (e.workSatSum / e.workSatCount).toFixed(2) : '0.00',
        punctualityRate: e.punctualTotal > 0 ? `${((e.punctualCount / e.punctualTotal) * 100).toFixed(0)}%` : '—',
        demoRate: e.demoTotal > 0 ? `${((e.demoCount / e.demoTotal) * 100).toFixed(0)}%` : '—',
      };
    }).sort((a, b) => b.totalFeedbacks - a.totalFeedbacks);

    // Format brand list
    const brandReports = Object.keys(brandMap).map((brand) => {
      const b = brandMap[brand];
      return {
        brand,
        totalFeedbacks: b.total,
        avgScore: (b.scoreSum / b.total).toFixed(2),
      };
    }).sort((a, b) => b.totalFeedbacks - a.totalFeedbacks);

    return NextResponse.json({
      success: true,
      data: {
        totalSubmitted,
        positiveCount,
        positivePercentage: `${positivePercentage}%`,
        negativeCount,
        negativePercentage: `${negativePercentage}%`,
        avgOverallScore,
        avgInstallSat,
        avgCallCentreSat,
        resolutionOnTimeRate: `${resolutionOnTimeRate}%`,
        ratingDistribution,
        engineerReports,
        brandReports,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/feedback/reports:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
