/**
 * Grunt build文件
 * //TODO: using Grunt to replace jake
 */
module.exports = function(grunt) {

  var buildName = new Date().getTime();
  console.log("buildName:%s", buildName);

  // Project configuration.
  grunt.initConfig({
    buildName : buildName,

    pkg: grunt.file.readJSON('package.json'),

    // ### grunt-contrib-clean
    // Clean up files as part of other tasks
    clean: {
        build: {
            src: ['build/**']
        }
    },



    // ### grunt-contrib-concat
    // concatenate multiple JS files into a single file ready for use
    concat: {
        cdn: {
            files: {
                'build/cdn/js/cag.js': [
                    'public/js/jquery.lazyload.js',
                    'public/js/sharepage.base.js',
                    'public/js/sharepage.js'
                ]
            },  
        },
        leafletplugin : {
            files: {
                'build/cdn/js/leaflet-plugin.js': [
                    'public/js/L.Control.Sidebar.js',
                    'public/js/leaflet.draw-src.js'
                ]
            }  
        }
    },

    // 压缩
    uglify: {
        options: {
            banner: '/*! <%= pkg.name %> */\n'
        },
        cdn: {
            files: {
                'build/cdn/js/cag_<%= buildName %>_min.js' : 'build/cdn/js/cag.js',
                'build/cdn/js/main_<%= buildName %>_min.js': 'public/js/main.js',
                'build/cdn/js/img_<%= buildName %>_min.js': 'public/js/img.js',
                'build/cdn/js/imglite_<%= buildName %>_min.js': 'public/js/imglite.js',
                'build/cdn/js/paintings_<%= buildName %>_min.js': 'public/js/paintings.js'
            }    
        },
        leafletplugin : {
            files: {
                'build/cdn/js/leaflet-plugin_min.js' : 'build/cdn/js/leaflet-plugin.js'
            }
        }
    },

    cssmin: {
        cdn :{
            files: {
                'build/cdn/css/main_<%= buildName %>_min.css': 'public/css/main.css'
            }
        },
         leafletplugin : {
            files:{
                'build/cdn/css/leaflet-plugin_min.css': [
                    'public/css/L.Control.Sidebar.css',
                    'public/css/leaflet.draw.css',
                    'public/css/leaflet.fullscreen.css'
                ]    
            }
        }
     },

    // ### grunt-contrib-copy
    // Copy files into their correct locations as part of building assets, or creating release zips
    copy: {
        // 发布到CDN网络的静态内容，js / html / images
        cdn: {
            files: [{
                cwd: 'public/',
                src: ['*.html', 'css/**', 'js/**', 'fonts/**', 'ico/**', 'images/**', 'favicon.ico'],
                dest: 'build/cdn',
                expand: true
            }]
        },
        bae: {
            noProcess : 'public',
            files: [{
                src: ['public/css/**', 'public/favicon.ico', 'public/*.html', 'public/fonts/**', 'public/ico/**', 'public/images/**' , 'data/**'
                    , 'routes/**', 'views/**', 'mongo.js' , 'sharepage.js'
                    , 'cag.js', 'package.json'],
                dest: 'build/bae',
                expand: true
            }]
        },
        // 发布到AppEngine的动态内容，js, html
        svn : {
            files: [{
                src: ['public/css/**', 'public/favicon.ico', 'public/*.html', 'public/fonts/**', 'public/ico/**', 'public/images/**' , 'data/**'
                    , 'routes/**', 'views/**', 'mongo.js' , 'sharepage.js'
                    , 'cag.js', 'package.json', 'cagstore.js' ],
                dest: '/Users/sanli/Documents/bae_workspace/clirepo/zhenbao',
                expand: true
            }]  
        }
    },


  });

  // 加载包含 "uglify" 任务的插件。
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // 默认被执行的任务列表。
  grunt.registerTask('default', [
    'concat:cdn', 'uglify:cdn', 'cssmin:cdn' , 
    'copy:cdn', 'copy:bae', 'copy:svn'
    ]);
  grunt.registerTask('leafletplugin', ['concat:leafletplugin', 'uglify:leafletplugin', 'cssmin:leafletplugin']);
};