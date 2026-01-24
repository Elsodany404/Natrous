const catchAsync = (asyncFunc) => {
    return (req, res, next) => {
        asyncFunc(req, res, next).catch(next);
    };
};
export default catchAsync;
