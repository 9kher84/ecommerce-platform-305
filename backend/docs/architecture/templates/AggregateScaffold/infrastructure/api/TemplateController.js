const asyncHandler = require('express-async-handler');
// const CreateTemplateUseCase = require('../../application/use-cases/CreateTemplateUseCase');

class TemplateController {
  
  // @desc    Create a template
  // @route   POST /api/v2/templates
  // @access  Private
  static createTemplate = asyncHandler(async (req, res) => {
    // const command = { ...req.body };
    // const result = await createTemplateUseCase.execute(command);

    // res.status(201).json({
    //   success: true,
    //   data: result
    // });
  });
}

module.exports = TemplateController;
