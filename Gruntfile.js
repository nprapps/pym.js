/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Load package config
    pkg: grunt.file.readJSON('package.json'),

    // Task configuration.
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        expr: true,
        sub: true,
        node: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        globals: {
          jQuery: true,
          requirejs: true,
        }
      },
      conf: [
        "Gruntfile.js",
        "bower.json",
        "package.json",
      ],
      pym: {
        options: {
          browser: true,
          predef: ['define']
        },
        src: "src/**/*.js",
      }
    },
    jsdoc: {
      dist: {
        src: ["src/**/*.js", "README.md", "package.json"],
        dest: "api",
        options: {
          template : "node_modules/minami",
          configure : "jsdoc.conf.json"
        }
      }
    },
    replace: {
      loader: {
        options: {
          patterns: [{
            match: 'defaultPymUrl',
            replacement: '<%= pkg.defaultPymUrl %>'
          }]
        },
        files: [
          {expand: true, flatten: true, src: ['src/pym-loader.js'], dest: 'build/'}
        ]
      }
    },
    preprocess:  {
      options: {
        context : {
          // Comment if we want autoinit to be stripped out
          AUTOINIT: true,
          ENV: 'production'
        }
      },
      pym : {
        src : 'src/pym.js',
        dest : 'build/pym.js'
      },
      loader : {
        src : 'build/pym-loader.js',
        dest : 'build/pym-loader.js'
      },
    },
    concat: {
      pym: {
        options: {
          banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                  '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        src: ['build/pym.js'],
        dest: 'dist/pym.v<%= pkg.version[0] %>.js'
      },
      loader: {
        options: {
          banner: '/*! pym-loader.js - v<%= pkg.version %> - ' +
                  '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        src: ['build/pym-loader.js'],
        dest: 'dist/pym-loader.v<%= pkg.version[0] %>.js'
      },
    },
    karma: {
      local: {
        configFile: 'karma.conf.js',
        background: true,
        singleRun: false
      },
      sauce: {
        configFile: 'karma.conf-sauce.js',
        background: true,
        singleRun: false
      }
    },
    uglify: {
      pym: {
        options: {
          banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                  '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        files: {
          'dist/p.v<%= pkg.version[0] %>.m.js': ['dist/pym.v<%= pkg.version[0] %>.js'],
          'dist/pym.v<%= pkg.version[0] %>.min.js': ['dist/pym.v<%= pkg.version[0] %>.js']
        }
      },
      loader: {
        options: {
          banner: '/*! pym-loader.js - v<%= pkg.version %> - ' +
                  '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        files: {
          'dist/pl.v<%= pkg.version[0] %>.m.js': ['dist/pym-loader.v<%= pkg.version[0] %>.js'],
          'dist/pym-loader.v<%= pkg.version[0] %>.min.js': ['dist/pym-loader.v<%= pkg.version[0] %>.js']
        }
      }
    },
    watch: {
      local: {
        files: ["src/**/*.js", "test/**/*.js", "test/**/*.html"],
        tasks: ["karma:local:run"] //NOTE the :run flag
      },
      sauce: {
        files: ["src/**/*.js", "test/**/*.js", "test/**/*.html"],
        tasks: ["karma:sauce:run"] //NOTE the :run flag
      },
      server: {
        files: ["src/**/*.js", "examples/**/*"],
        options: {
          livereload: true
        }
      }
    },
    // via http://rhumaric.com/2013/07/renewing-the-grunt-livereload-magic/
    express: {
      all: {
        options: {
          port: 9000,
          hostname: "localhost",
          bases: ['.'],
          livereload: true,
          open: 'http://localhost:<%= express.all.options.port%>/examples/simple/'
        }
      }
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-jsdoc");
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-preprocess');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-express');

  // Default task.
  grunt.registerTask("default", ["jshint", "replace", "preprocess", "concat", "uglify", "jsdoc"]);
  grunt.registerTask("test", ["karma:local:start", "watch:local"]);
  grunt.registerTask("sauce", ["karma:sauce:start", "watch:sauce"]);
  grunt.registerTask("server", ["express", "watch:server"]);


};
