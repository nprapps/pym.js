#!/usr/bin/env python
# _*_ coding:utf-8 _*_
import os
import shutil
import glob
import gzip
import logging
from distutils.util import strtobool
from fabric.api import task, local

LOG_FORMAT = '%(levelname)s:%(name)s:%(asctime)s: %(message)s'
LOG_LEVEL = logging.INFO

# GLOBAL SETTINGS
cwd = os.path.dirname(__file__)
logging.basicConfig(format=LOG_FORMAT)
logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
S3_BUCKET = 'pym.nprapps.org'
GZIP_FILE_TYPES = ['*.js']
# DEFAULT_MAX_AGE = 604800  # One week
DEFAULT_MAX_AGE = 86400  # One day


def prep_bool_arg(arg):
    return bool(strtobool(str(arg)))


def compress(in_path=None, out_path=None):
    """
    Gzips everything in in_path and puts it all in out_path
    """
    for file in glob.glob('%s/*.js' % in_path):
        fname = os.path.basename(file)
        with open(file, 'rb') as fin, gzip.GzipFile('%s/%s' % (
                out_path, fname), 'wb', mtime=0) as fout:
            shutil.copyfileobj(fin, fout)


@task
def deploy(relpath='../dist', dryrun=False):
    """
    sync folder to s3 bucket
    """
    dryrun = prep_bool_arg(dryrun)
    INPUT_PATH = os.path.join(cwd, relpath)
    OUTPUT_PATH = os.path.join(cwd, '../.gzip')
    # Wipe the old .gzip folder
    shutil.rmtree(OUTPUT_PATH, ignore_errors=True)
    # Create output files folder if needed
    if not os.path.exists(OUTPUT_PATH):
        os.makedirs(OUTPUT_PATH)

    compress(INPUT_PATH, OUTPUT_PATH)
    logger.info('compressed files inside %s' % os.path.abspath(INPUT_PATH))


    command = 'aws s3 sync %s s3://%s --acl="public-read"' % (
        os.path.abspath(OUTPUT_PATH), S3_BUCKET)
    # add cache control header
    command += ' --cache-control "max-age=%i"' % (DEFAULT_MAX_AGE)
    if dryrun:
        command += ' --dryrun'

    # add include exclude options and content-encoding
    command += ' --content-encoding "gzip" --exclude="*"'
    arg = '--include'
    for ext in GZIP_FILE_TYPES:
        command += ' %s="%s"' % (arg, ext)
    # logger.info(command)
    local(command)
