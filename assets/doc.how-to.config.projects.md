# [Projects Configuration](@nav/doc/api/youwol/app/environment/models.models_project.Projects)

Projects configuration is managed using an instance of
[Projects](@nav/doc/api/youwol/app/environment/models.models_project.Projects). 
This configuration encompasses:
*  the definition of one or more 
   [ProjectsFinder](@nav/doc/api/youwol/app/environment/models.models_project.ProjectsFinder). 
   These are used to locate projects on your computer. Each project finder is displayed as a node under 
   the [Projects](@nav/projects) page (using the <i class='fas fa-object-group'></i> icon).
*  A list of [ProjectsTemplate](@nav/doc/api/youwol/app/environment/models.models_project.ProjectsTemplate).
   A project template provides a starter project and is accessible from the **New project** section of the
   [Projects page](@nav/projects).

<note level="hint">
 If no custom configuration for the `Projects` attribute is provided in the configuration file, 
a default setup is applied:
*  A single project finder is included, looking in the
[default path](@nav/doc/api/youwol/app/environment/models.defaults.default_path_projects_dir).
*  A few project templates are made available as starters.
</note>

## [Projects Finder](@nav/doc/api/youwol/app/environment/models.models_project.ProjectsFinder)

Below is an example showcasing various configuration options for `ProjectsFinder`.

<code-snippet language="python">
from pathlib import Path

from youwol.app.environment import (
        Configuration,
        Projects,
        ProjectsFinder
    )

folder_js = Path.home() / 'Projects-JS'
folder_ts = Path.home() / 'Projects-TS'
folder_py = Path.home() / 'Projects-Py'

Configuration(
    projects=Projects(
        finder = [
            ProjectsFinder(
                fromPaths=folder_js,
            ),
            ProjectsFinder(
                fromPaths=folder_ts,
                lookUpDepth=2,
                watch=True
            )
            ProjectsFinder(
                fromPaths=folder_py,
                lookUpDepth=3,
                watch=False,
                lookUpIgnore=["**/__pycache__"]
            ),
        ]
    )
)
</code-snippet>

## [Projects Template](@nav/doc/api/youwol/app/environment/models.models_project.ProjectsTemplate)

A project template is essentially a Python function that generates a starter project in a specified folder.
These templates are typically part of a Python package that also defines the pipeline associated with that type of 
project.

For example, YouWol provides the [pipeline raw app](@nav/doc/api/youwol/pipelines/pipeline_raw_app) - a basic pipeline
for packaging and publishing JavaScript applications. This package also exposes the
[template](@nav/doc/api/youwol/pipelines/pipeline_raw_app.template.template) function.


To include this project starter in your configuration:

<code-snippet language="python" highlightedLines="18-20">
from youwol.app.environment import (
    Configuration,
    ProjectsFinder,
    Projects
)
import youwol.pipelines.pipeline_raw_app as pipeline_raw_app

projects_folder = Path.home() / 'raw_apps'
Configuration(
    projects=Projects(
        finder=[
            ProjectsFinder(
                fromPath=projects_folder,
                lookUpDepth=1,
                watch=True
            ),
        ],
        templates=[
            pipeline_raw_app.template(
                folder=projects_folder
            )
        ]
    )
)
</code-snippet>


By doing so:
*  A `Raw JS Application` option will be available under the **New project** section 
   of the [Projects](@nav/projects) page.
*  When a project is created, it will be placed in the `projects_folder`.
*  Since a `ProjectsFinder` is set to watch this folder, CoLab will automatically update and display the newly
   created project under a <i class='fas fa-object-group'>raw_apps</i> node in the [Projects](@nav/projects) node. 

<note level="hint">
Defining a custom pipeline and project template is generally straightforward.
You can explore several examples in the YouWol repository, such as:
<a href="https://github.com/youwol/py-youwol/tree/main/src/youwol/pipelines/pipeline_raw_app" target="_blank">
Pipeline Raw App</a>,
<a href="https://github.com/youwol/py-youwol/tree/main/src/youwol/pipelines/pipeline_python_backend" target="_blank">
Pipeline Python Backend</a>, and
<a href="https://github.com/youwol/py-youwol/blob/main/lib/yw_clients/.yw_pipeline/yw_pipeline.py" target="_blank">
YouWol Clients Pipeline</a>.

</note>