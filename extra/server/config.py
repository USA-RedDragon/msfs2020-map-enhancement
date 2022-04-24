from dataclasses import dataclass
import os

from dataclasses_json import dataclass_json
from log import logger

PROGRAMDATA_DIR = os.getenv('PROGRAMDATA') + '/msfs2020-map-enhancement'
CONFIG_FILE = PROGRAMDATA_DIR + '/server-config.json'
os.makedirs(PROGRAMDATA_DIR, exist_ok=True)


@dataclass_json
@dataclass
class Config:
    proxyAddress: str
    selectedServer: str
    cacheLocation: str
    cacheEnabled: bool
    cacheSizeGB: int
    mapboxAccessToken: str
    enableHighLOD: bool


class ConfigStore:
    def __init__(self) -> None:
        self.load()

    def inject(self, config: Config) -> None:
        self.config = config
        self.save()

    def save(self) -> None:
        if self.config:
            with open(CONFIG_FILE, 'wt') as f:
                f.write(self.config.to_json())

    def load(self) -> None:
        try:
            with open(CONFIG_FILE, 'rt') as f:
                self.config = Config.from_json(str(f.read()))
        except FileNotFoundError:
            # No config found, use defaults
            self.config = Config(
                proxyAddress=None,
                selectedServer="mt.google.com",
                cacheLocation="./cache",
                cacheEnabled=False,
                cacheSizeGB=10,
                mapboxAccessToken="",
                enableHighLOD=False)
            self.save()
        except Exception as e:
            logger.error("Exception while loading config.")
            logger.exception(e)

    def get_config(self) -> Config:
        if self.config:
            return self.config
