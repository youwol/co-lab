# Quick Tour

<note level='hint'>
For an optimal experience while following this tutorial, it's recommended to enable dual view, keeping this 
documentation separate. 
To do this, click the <i class="fas fa-object-ungroup"></i> icon in the side navigation panel, 
located under the <i class="fas fa-book px-1"></i> **Doc** section.
</note>

## Objectives

*  Learn how to create a simple JavaScript application
*  Learn how to publish it on your PC and share it with your community.

---

## Project Creation

YouWol provides several standard project templates, each implemented as a Python module. These templates also define a 
pipeline that outlines the necessary steps (e.g., `setup`, `build`, `test`) to create an executable component.

Let's create a simple JavaScript project starter:

*  Navigate to the [projects page](@nav/projects).
*  Under the section **New project**:
   *  expand the **Raw JS Application** group
   *  provide a name
   *  click **Generate**.

The project should open with its pipeline displayed.


<expandable title="Additional info" icon="fas fa-question-circle text-success">
Here, we used a template for a basic web application, managed by the YouWol’s Python module 
[pipeline_raw_app](@nav/doc/api/youwol/pipelines/pipeline_raw_app).
The default configuration includes it among a couple of others.

For additional information regarding how YouWol is looking for projects, or how to define your own template & pipeline,
a starting point can be found [here](@nav/doc/how-to/config/projects)
</expandable>

---

## Launch Project

This pipeline is the least opinionated when it comes to the technology stack, making it suitable for any kind of
JavaScript project, as long as it produces a valid web application.
However, it does not provide built-in tools for tasks like building or testing—the responsibility for these steps lies
entirely with the user.
It features 3 steps:
*  **package**: Package selected files into an artifact named `package`.
*  **cdn-local**: Publish the `package` artifact into the local components database.
*  **cdn_prod**: Publish the component from the local database to the remote on (on `platform.youwol.com`).

### Package

Select the first `package` step from the flow chart and execute it using the <i class='fas fa-play text-success'></i>
button.
Once complete, a `package` artifact is will appear under the **Artifacts** section.
You can expand it to view its contents.

### cdn-local

Select the `cdn-local` step and execute it. Once finished, the <i class='fas fa-play text-primary'></i> icon in the
project's page header will activate. Click it to open your application in a new tab.

The header also includes the <i class='fas fa-microchip text-primary'></i> icon,
linking to the built component’s details page. 
This page summarizes the component and displays the union of all published artifacts.
No links are provided here, but usual pipelines provide links for *e.g.* documentation, bundle analysis, 
coverage, *etc*.

### cdn_prod

Select the `cdn_prod` step and execute it. After completion, your application is available online at the URL:

`https://platform.youwol.com/applications/{APP_NAME}/{APP_VERSION}`

Where:
*  `{APP_NAME}` is the name of your application.
*  `{APP_VERSION}` is the version of your application, supporting semantic versioning (*e.g.* `*` for the latest 
    version). 

<note level="warning">
By default, your application is published with a **private** access policy. 
To modify this policy, click the <i class="fas fa-folder text-primary"></i> icon in the project's header page
and adjust the permissions under the **Access** section. 
Set the `read` policy of **Default access** to `Authorized`, then re-run the `cdn-prod` step.
</note>

<expandable title="About Work In Progress (wip)" icon="fas fa-question-circle text-success">

As you have noticed, the version of the application is suffixed by `-wip`. 
When a component's version (library, application or backend) is suffixed like this, the different caching mechanisms
are disabled such that you get the latest changed of the corresponding version. 

However, final version (not ending with `-wip`), are cached at different places for optimal performance.
Because of that, they should be published only once (as usual when publishing package). 

</expandable>