try:
    # noqa: F401
    import server
except Exception as e:
    from log import logger
    logger.error("Unhandled Exception:")
    logger.exception(e)
