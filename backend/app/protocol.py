"""protocols to follow
"""


class response:
    """response protocol. Used to to pass messages between layers

    Args:
        success (bool): True or False if function succeeded
        data (dict, optional): Defaults to None. otherwise a python dict
        message (str, optional): Defaults to None.

        access properties by response.success, response.data, response.message
    """
    def __init__(self, success: bool, data: object=None, message: str=None):
        self.success = success
        self.data = data
        self.message = message
