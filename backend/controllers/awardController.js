const AwardService = require("../services/awardService");
const catchAsync = require("../utils/catchAsync");

exports.submitAward = catchAsync(async (req, res, next) => {
  const { rfqId, awardSelections } = req.body;
  
  if (!rfqId || !awardSelections) {
    return res.status(400).json({ success: false, message: "rfqId and awardSelections are required." });
  }

  const result = await AwardService.submitAward(rfqId, req.user.id, awardSelections);

  res.status(201).json({
    success: true,
    message: "Awards processed successfully.",
    data: result
  });
});
