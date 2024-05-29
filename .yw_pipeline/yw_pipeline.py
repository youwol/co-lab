from pathlib import Path

from youwol.app.environment import YouwolEnvironment
from youwol.app.routers.projects import IPipelineFactory, BrowserApp, Execution, Link, BrowserAppGraphics
from youwol.pipelines.pipeline_typescript_weback_npm import pipeline, PipelineConfig, PublishConfig
from youwol.utils import parse_json, encode_id
from youwol.utils.context import Context


folder_path = Path(__file__).parent.parent
pkg_json = parse_json(folder_path / "package.json")
asset_id = encode_id(pkg_json['name'])
version = pkg_json['version']


class PipelineFactory(IPipelineFactory):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    async def get(self, _env: YouwolEnvironment, context: Context):
        config = PipelineConfig(target=BrowserApp(
            displayName="Co-Lab",
            execution=Execution(
                standalone=True
            ),
            graphics=BrowserAppGraphics(
                appIcon=icon(size_px='100%', border_radius='15%', icon_path=app_icon),
                fileIcon={}
            ),
            links=[
                Link(name="doc", url="dist/docs/index.html"),
                Link(name="coverage", url="coverage/lcov-report/index.html"),
                Link(name="bundle-analysis", url="dist/bundle-analysis.html")
            ]
        ), publishConfig=PublishConfig(packagedFolders=["assets"]))
        return await pipeline(config, context)


assets_dir = f"/api/assets-gateway/cdn-backend/resources/{asset_id}/{version}/assets"
app_icon = f"url('{assets_dir}/co-lab-light.png')"


def icon(size_px: str, border_radius: str, icon_path: str, bg_size: str = "cover"):
    return {
        "style": {
            "width": f"{size_px}",
            "height": f"{size_px}",
            "background-image": icon_path,
            "background-size": bg_size,
            "background-repeat": "no-repeat",
            "background-position": "center center",
            "border-radius": f"{border_radius}",
        }
    }
